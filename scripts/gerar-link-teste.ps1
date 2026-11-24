$ErrorActionPreference = 'Stop'

$equipe = 'team_HsQ9frGp6mCt66drMt4dGB59'
$projeto = 'prj_Rh5RqorbXgnj9eo0sczYWYgfUDwh'
$duracaoSegundos = 3600
$arquivoLocal = Join-Path $PSScriptRoot '..\.test-output\link-de-teste-local.json'

function Consultar-Vercel {
    param([string]$Caminho, [hashtable]$Corpo)

    $ErrorActionPreference = 'Continue'
    if ($Corpo) {
        $resposta = $Corpo | ConvertTo-Json -Depth 4 -Compress | & node.exe $entradaCli api $Caminho -X PATCH --input - --raw 2>&1
    } else {
        $resposta = & node.exe $entradaCli api $Caminho --raw 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        if (($resposta -join "`n") -match 'shareable link already exists') {
            $conflito = [InvalidOperationException]::new('Esta previa tem um link gerado fora do atalho. Se estiver valido, copie-o pela janela Share da Vercel. Se estiver vencido, revogue-o nessa janela e rode o atalho novamente.')
            $conflito.Data['LinkExistente'] = $true
            throw $conflito
        }
        throw 'A Vercel recusou a operacao. Confira se voce entrou na CLI com vercel login e tem acesso ao Tatame Test.'
    }
    ($resposta | Where-Object { $_ -is [string] }) -join "`n" | ConvertFrom-Json -ErrorAction Stop
}

function Ler-LinkLocal {
    param([string]$Publicacao)

    if (-not (Test-Path -LiteralPath $arquivoLocal)) { return }
    try {
        $registro = Get-Content -LiteralPath $arquivoLocal -Raw | ConvertFrom-Json
        if ($registro.publicacao -ne $Publicacao) { return }
        $segredo = [System.Net.NetworkCredential]::new('', (ConvertTo-SecureString $registro.cifrado)).Password
        if ($segredo -match '^[A-Za-z0-9_-]+$') {
            return @{ segredo = $segredo; vence = [long]$registro.vence }
        }
    } catch {
        Write-Warning 'Nao foi possivel ler o link salvo para este usuario do Windows.'
    }
}

function Salvar-LinkLocal {
    param([string]$Publicacao, [hashtable]$Link)

    $null = New-Item -ItemType Directory -Force -Path (Split-Path -Parent $arquivoLocal)
    $cifrado = ConvertTo-SecureString $Link.segredo -AsPlainText -Force | ConvertFrom-SecureString
    @{ publicacao = $Publicacao; vence = $Link.vence; cifrado = $cifrado } |
        ConvertTo-Json -Compress | Set-Content -LiteralPath $arquivoLocal -Encoding UTF8
}

try {
    $cli = Get-Command vercel.cmd -CommandType Application -ErrorAction SilentlyContinue
    if (-not $cli) {
        throw 'Instale a CLI com npm install -g vercel e execute vercel login uma vez.'
    }
    # Chame o Node diretamente para preservar o & da consulta ao passar os argumentos.
    $entradaCli = Join-Path (Split-Path -Parent $cli.Source) 'node_modules\vercel\dist\vc.js'
    if (-not (Test-Path -LiteralPath $entradaCli -PathType Leaf)) {
        throw 'A instalacao da CLI da Vercel nao foi encontrada. Rode npm install -g vercel.'
    }

    $lista = Consultar-Vercel "/v7/deployments?projectId=$projeto&teamId=$equipe&limit=20"
    $previa = $lista.deployments | Where-Object {
        $_.PSObject.Properties['target'] -and $_.target -in @($null, 'preview', 'staging')
    } | Sort-Object created -Descending | Select-Object -First 1

    if (-not $previa) { throw 'A Vercel ainda nao tem uma previa para o Tatame Test.' }
    if ($previa.state -ne 'READY') {
        throw "A ultima previa esta com status $($previa.state). Confira a publicacao na Vercel antes de tentar de novo."
    }
    if ($previa.uid -notmatch '^dpl_[A-Za-z0-9]+$' -or $previa.url -notmatch '^tatame-test-[a-z0-9-]+-cleiton-pirola\.vercel\.app$') {
        throw 'A Vercel retornou um endereco inesperado para a previa do Tatame Test.'
    }

    $agora = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $link = Ler-LinkLocal $previa.uid
    if (-not $link -or $link.vence -le $agora) {
        $caminho = "/aliases/$($previa.uid)/protection-bypass?teamId=$equipe"
        try {
            $liberacao = Consultar-Vercel $caminho @{ ttl = $duracaoSegundos }
        } catch {
            if (-not $link -or -not $_.Exception.Data['LinkExistente']) { throw }
            # A Vercel ainda registra o link vencido. Remova apenas o que este atalho salvou.
            $null = Consultar-Vercel $caminho @{ revoke = @{ secret = $link.segredo; regenerate = $false } }
            $liberacao = Consultar-Vercel $caminho @{ ttl = $duracaoSegundos }
        }
        $linkTemporario = $liberacao.protectionBypass.PSObject.Properties | Where-Object {
            $_.Name -match '^[A-Za-z0-9_-]+$' -and $_.Value.scope -eq 'shareable-link' -and
            $_.Value.expires -gt $agora -and $_.Value.expires -le ($agora + $duracaoSegundos + 30)
        } | Sort-Object { $_.Value.expires } -Descending | Select-Object -First 1

        if (-not $linkTemporario) { throw 'A Vercel nao retornou um link de compartilhamento com validade de ate uma hora.' }
        $link = @{ segredo = $linkTemporario.Name; vence = $linkTemporario.Value.expires }
        Salvar-LinkLocal $previa.uid $link
    }

    $origem = "https://$($previa.url)"
    $url = "$origem/?_vercel_share=$($link.segredo)"

    try {
        $null = Invoke-WebRequest -Uri $url -SessionVariable tatameSessao -UseBasicParsing -TimeoutSec 15
        $estado = Invoke-RestMethod -Uri "$origem/api/auth/estado" -WebSession $tatameSessao -TimeoutSec 15
        if (-not $estado.PSObject.Properties['usuario']) { throw 'Resposta inesperada.' }
    } catch {
        throw 'A previa publicada nao abriu o login do Tatame. Confira o ambiente de testes e tente de novo.'
    }

    Set-Clipboard -Value $url
    $ate = [DateTimeOffset]::FromUnixTimeSeconds($link.vence).ToLocalTime().ToString('HH:mm')
    Write-Host "Link copiado. Valido ate $ate no horario deste computador."
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
