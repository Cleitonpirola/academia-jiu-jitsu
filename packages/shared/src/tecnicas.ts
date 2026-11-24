export interface ConfiguracaoTecnicas {id:string;ativa:boolean;valorMensalCentavos:number;instrucoes:string;atualizadoEm:string}
export interface VideoTecnica {id:string;titulo:string;descricao:string;semana:string;tipoTreino:'Com kimono'|'Sem kimono';url:string;publicado:boolean;criadoEm:string;atualizadoEm:string}
export interface AcessoTecnicas {id:string;validoAte:string;liberadoPorId:string;atualizadoEm:string}
export interface BibliotecaTecnicas {config:ConfiguracaoTecnicas;liberado:boolean;validoAte:string|null;videos:Omit<VideoTecnica,'url'>[]}
export interface GestaoTecnicas {config:ConfiguracaoTecnicas;videos:VideoTecnica[];acessos:AcessoTecnicas[];alunos:{id:string;nome:string}[];armazenamentoConfigurado?:boolean;driveConfigurado?:boolean}
