"use client"

import Link from "next/link"

const S = ({ children }: { children: React.ReactNode }) => (
  <section className="space-y-4">{children}</section>
)
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[17px] font-bold text-foreground uppercase tracking-wide mt-12 mb-3">{children}</h2>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[14px] leading-[1.8] text-foreground/85">{children}</p>
)
const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="text-[14px] leading-[1.8] text-foreground/85 pl-1">{children}</li>
)

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          &larr; Voltar para o site
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Politica de Privacidade</h1>
        <p className="text-[13px] text-muted-foreground mb-12">Atualizada em 26 de marco de 2026</p>

        {/* Index */}
        <nav className="rounded-xl border border-border/40 bg-card/30 px-6 py-5 mb-12">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Indice</p>
          <ol className="columns-1 sm:columns-2 gap-x-8 space-y-1.5 text-[13px] text-accent list-decimal list-inside">
            {[
              "Principios Norteadores",
              "Informacoes que Coletamos",
              "Como Usamos suas Informacoes",
              "Compartilhamento das Informacoes",
              "Seguranca das Informacoes",
              "Encarregado de Dados (DPO)",
              "Governanca e Responsabilidade",
              "Atualizacoes da Politica",
              "Foro",
            ].map((item, i) => (
              <li key={i} className="hover:underline cursor-default">{item}</li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          <P>
            Nos da <strong>AILUM SOLUCOES LTDA</strong> (&quot;Ailum&quot;), inscrita no CNPJ sob o n. <strong>65.678.502/0001-11</strong>, empresa com sede na Rua Mateus Leme, 5352, Sao Lourenco, na cidade de Curitiba (PR), CEP n. 82.210-290, nos preocupamos com a privacidade dos nossos usuarios.
          </P>

          <P>
            Ao acessar e/ou utilizar a Ailum, seja a plataforma (app.ailum.io) ou o site (ailum.io), voce (o &quot;Usuario&quot;) declara ter no minimo 18 (dezoito) anos e ter capacidade plena e expressa para a aceitacao dos termos e condicoes desta Politica de Privacidade e dos <Link href="/termos-de-uso" className="text-accent hover:underline">Termos de Uso</Link> para todos os fins de direito.
          </P>

          <P>
            Caso nao se enquadre na descricao acima e/ou nao concorde, ainda que em parte, com os termos e condicoes contidos nesta Politica de Privacidade, nao devera acessar e/ou utilizar os servicos oferecidos pela Ailum, bem como os sites e servicos por ela operados.
          </P>

          <P>
            A aceitacao desta Politica sera feita quando voce acessar ou usar o site, aplicativo ou servicos da Ailum, isso indicara que voce esta ciente e em total acordo com a forma como utilizaremos as suas informacoes e seus dados.
          </P>

          <P>
            Este documento e regido em conformidade com a Lei n. 13.709/2018 (Lei Geral de Protecao de Dados), pela GDPR (General Data Protection Regulation) e Lei n. 12.965/2014 (Marco Civil da Internet).
          </P>

          {/* 1 */}
          <S>
            <H2>1. Principios Norteadores</H2>
            <P>
              <strong>1.1.</strong> A Ailum fundamenta todas as atividades de tratamento de dados pessoais nos seguintes principios estabelecidos pela LGPD:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Finalidade:</strong> Tratamos dados para propositos legitimos, especificos, explicitos e informados ao titular.</Li>
              <Li><strong>Adequacao:</strong> O tratamento e compativel com as finalidades informadas e necessario para a prestacao dos nossos servicos.</Li>
              <Li><strong>Necessidade:</strong> Coletamos apenas dados estritamente necessarios para as finalidades pretendidas.</Li>
              <Li><strong>Livre Acesso:</strong> Garantimos consulta facilitada e gratuita sobre a forma e duracao do tratamento.</Li>
              <Li><strong>Qualidade dos dados:</strong> Asseguramos exatidao, clareza, relevancia e atualizacao dos dados.</Li>
              <Li><strong>Transparencia:</strong> Fornecemos informacoes claras, precisas e facilmente acessiveis sobre o tratamento.</Li>
              <Li><strong>Seguranca:</strong> Utilizamos medidas tecnicas e administrativas para proteger os dados contra acessos nao autorizados.</Li>
              <Li><strong>Prevencao:</strong> Adotamos medidas para prevenir danos em decorrencia do tratamento de dados pessoais.</Li>
              <Li><strong>Nao discriminacao:</strong> Nao realizamos tratamento para fins discriminatorios ilicitos ou abusivos.</Li>
              <Li><strong>Responsabilizacao e prestacao de contas:</strong> Adotamos medidas eficazes e capazes de comprovar a observancia e cumprimento das normas de protecao de dados.</Li>
            </ul>
          </S>

          {/* 2 */}
          <S>
            <H2>2. Informacoes que Coletamos</H2>

            <P><strong>2.1. Informacoes que voce nos fornece:</strong></P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Dados de cadastro e compra:</strong> Para adquirir algum plano da Ailum, voce nos fornece informacoes como nome, sobrenome, endereco eletronico (e-mail), numero de telefone, CPF/CNPJ e CEP.</Li>
              <Li><strong>Informacoes de autenticacao:</strong> Para criar uma conta na plataforma lhe proporcionando um ambiente seguro, solicitamos que voce nos forneca informacoes de identificacao, por exemplo, nome, endereco eletronico (e-mail) utilizado na compra e cadastro de senha.</Li>
              <Li><strong>Dados da clinica:</strong> Nome, endereco, logotipo, site e descricao da clinica ou consultorio.</Li>
              <Li><strong>Dados de profissionais:</strong> Nome, especialidade, biografia, foto e disponibilidade de horarios.</Li>
              <Li><strong>Dados financeiros:</strong> Informacoes de servicos, precos e dados de cobranca Pix.</Li>
            </ul>

            <P><strong>2.2. Informacoes geradas quando voce usa nossos servicos:</strong></P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Registros de acesso:</strong> A Ailum coleta automaticamente registros de acesso a aplicacao, que incluem o endereco IP, com data e hora, utilizado para acessar a Ailum. Esses dados sao de coleta obrigatoria, de acordo com a Lei 12.965/2014, mas somente serao fornecidos para terceiros com a sua autorizacao expressa ou por meio de demanda judicial.</Li>
              <Li><strong>Dados de uso:</strong> Nos coletamos informacoes sobre suas interacoes na Ailum, como sua navegacao, conteudos que voce acessa ou cria, suas buscas e, de forma geral, suas acoes durante o uso da plataforma.</Li>
              <Li><strong>Mensagens:</strong> Conversas do WhatsApp integrado (texto, imagem, audio, documentos) transacionadas na plataforma.</Li>
              <Li><strong>Dados de contatos/pacientes:</strong> Nome, telefone, e-mail, historico de interacoes e status no funil de vendas.</Li>
              <Li><strong>Dados de agendamentos:</strong> Datas, horarios, profissional, servico e status dos agendamentos.</Li>
              <Li><strong>Dados de pagamentos:</strong> Valores, status, codigos Pix e notas fiscais geradas.</Li>
              <Li><strong>Memorias da IA:</strong> Informacoes extraidas das conversas para personalizacao do atendimento automatizado.</Li>
              <Li><strong>Dados de voz:</strong> Amostras de audio enviadas para clonagem de voz utilizada nas respostas por audio.</Li>
              <Li><strong>Caracteristicas do equipamento:</strong> Como a maioria das aplicacoes, para poder funcionar a Ailum pode coletar automaticamente dados sobre as caracteristicas do seu aparelho, dentre as quais o seu sistema operacional, a versao deste, informacoes de hardware, o idioma, sinal de internet e bateria.</Li>
              <Li><strong>Comunicacoes com a Ailum:</strong> Quando voce se comunica com a Ailum, coletamos informacoes sobre sua comunicacao, incluindo metadados como data, IP e hora das comunicacoes e todo o seu conteudo, assim como qualquer informacao que voce escolha fornecer.</Li>
              <Li><strong>Cookies e tecnologias semelhantes:</strong> Nos utilizamos cookies, que sao arquivos de texto gerados e armazenados no seu navegador ou aparelho por sites, aplicativos e anuncios online. Os cookies poderao ser utilizados para as seguintes finalidades: autenticacao de Usuarios, lembrar preferencias e configuracoes dos Usuarios.</Li>
            </ul>

            <P><strong>2.3. Informacoes de outras fontes:</strong></P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Dados coletados de outras plataformas:</strong> A Ailum podera interagir com outras plataformas e outros servicos, como WhatsApp (via Z-API), Google Calendar e outros sistemas integrados. Alguns desses servicos podem nos fornecer informacoes sobre voce, os quais coletamos para lhe proporcionar uma melhor experiencia e melhorar cada vez mais os nossos servicos e lhe oferecer novas funcionalidades, bem como para utilizacao dentro da plataforma como ferramenta de comunicacao e atendimento.</Li>
            </ul>

            <P>
              <strong>2.4.</strong> A Ailum nao coleta intencionalmente dados pessoais sensiveis (origem racial ou etnica, conviccao religiosa, opiniao politica, filiacao sindical, dados de saude, vida sexual, dado genetico ou biometrico). Caso dados sensiveis sejam inadvertidamente coletados atraves de humanos ou por inteligencia artificial, os mesmos serao imediatamente identificados e isolados em nossos sistemas, excluidos no menor prazo possivel e iremos implementar medidas para evitar novas ocorrencias.
            </P>
          </S>

          {/* 3 */}
          <S>
            <H2>3. Como Usamos suas Informacoes</H2>
            <P>
              <strong>3.1.</strong> Fundamentamos o tratamento dos seus dados pessoais nas seguintes bases legais previstas na LGPD:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Execucao do contrato (Art. 7, V):</strong> Para permitir acesso e uso de todas as funcionalidades da Ailum, processar agendamentos e pagamentos, gerar notas fiscais, fornecer suporte tecnico e executar os servicos contratados.</Li>
              <Li><strong>Cumprimento de obrigacao legal (Art. 7, II):</strong> Para manter registros de acesso conforme Marco Civil da Internet, cumprir obrigacoes fiscais e tributarias, e atender determinacoes de autoridades competentes.</Li>
              <Li><strong>Legitimo interesse (Art. 7, IX):</strong> Para melhorar nossos servicos, personalizar sua experiencia, detectar fraudes e garantir seguranca da plataforma, desde que nao prejudique seus direitos fundamentais.</Li>
              <Li><strong>Consentimento (Art. 7, I):</strong> Para envio de comunicacoes promocionais, analise comportamental para marketing, compartilhamento com parceiros para ofertas personalizadas e uso de cookies nao essenciais.</Li>
              <Li><strong>Exercicio de Direitos (Art. 7, VI):</strong> Para estabelecer, exercer ou defender direitos em processos administrativos ou judiciais.</Li>
            </ul>

            <P>
              <strong>3.2.</strong> Voce pode solicitar informacoes especificas sobre qual base legal utilizamos para cada finalidade atraves do e-mail de contato do nosso DPO, conforme indicado na clausula 6.1.
            </P>

            <P>
              <strong>3.3.</strong> Ao utilizar a Ailum voce autoriza que os seus dados sejam utilizados para:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>Permitir que voce acesse e utilize todas as funcionalidades da Ailum;</Li>
              <Li>Processar agendamentos, pagamentos e emissao de notas fiscais;</Li>
              <Li>Operar a inteligencia artificial de atendimento;</Li>
              <Li>Gerar audio de voz para respostas no WhatsApp;</Li>
              <Li>Enviar a voce mensagens a respeito de suporte ou servico, como alertas, notificacoes e atualizacoes;</Li>
              <Li>Nos comunicar com voce sobre produtos, servicos, promocoes, noticias, atualizacoes, eventos e outros assuntos que voce possa ter interesse;</Li>
              <Li>Analisar o trafego dos usuarios em nossas aplicacoes;</Li>
              <Li>Realizar publicidade direcionada conforme seus gostos, interesses e outras informacoes coletadas;</Li>
              <Li>Personalizar o servico para este adequar cada vez mais aos seus gostos e interesses;</Li>
              <Li>Criarmos novos servicos, produtos e funcionalidades;</Li>
              <Li>Deteccao e prevencao de fraudes, spam e incidentes de seguranca;</Li>
              <Li>Verificar ou autenticar as informacoes fornecidas por voce, inclusive comparando a dados coletados de outras fontes;</Li>
              <Li>Entender melhor o comportamento do usuario e construir perfis comportamentais;</Li>
              <Li>Para qualquer fim que voce autorizar no momento da coleta de dados;</Li>
              <Li>Cumprir obrigacoes legais.</Li>
            </ul>

            <P>
              <strong>3.4.</strong> Eventualmente, poderemos utilizar dados para finalidades nao previstas nesta politica de privacidade, mas estas estarao dentro das suas legitimas expectativas e, sempre que possivel, serao comunicadas previamente.
            </P>

            <P>
              <strong>3.5.</strong> O eventual uso dos seus dados para finalidades que nao cumpram com essa prerrogativa sera feito mediante sua autorizacao previa.
            </P>

            <P>
              <strong>3.6. Prazo de retencao dos dados.</strong> Mantemos seus dados pessoais apenas pelo tempo necessario para as finalidades descritas ou conforme exigido por lei:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Dados cadastrais e contratuais:</strong> Ate 5 anos apos o termino do contrato, conforme Codigo Civil e legislacao tributaria.</Li>
              <Li><strong>Registros de acesso (IP, data, hora):</strong> Ate 6 meses, conforme Marco Civil da Internet.</Li>
              <Li><strong>Dados de pagamento:</strong> Ate 5 anos apos a transacao, conforme legislacao tributaria.</Li>
              <Li><strong>Comunicacoes e mensagens (entre voce e a Ailum):</strong> Ate 2 anos apos termino do contrato, para eventual resolucao de conflitos.</Li>
              <Li><strong>Cookies tecnicos:</strong> Durante a sessao de navegacao.</Li>
              <Li><strong>Cookies de marketing:</strong> Ate 12 meses ou revogacao do consentimento.</Li>
              <Li><strong>Dados para prevencao de fraudes:</strong> Ate 5 anos apos a deteccao do incidente.</Li>
            </ul>

            <P>
              <strong>3.7. Exclusao dos dados.</strong> Decorridos os prazos de retencao, os dados serao automaticamente excluidos ou anonimizados de forma irreversivel, salvo obrigacao legal em contrario ou necessidade de preservacao destes para resguardo de direitos da Ailum.
            </P>

            <P>
              <strong>3.8. Monitoramento.</strong> A Ailum se reserva no direito de monitorar toda a plataforma, principalmente para assegurar que as regras descritas em nossos <Link href="/termos-de-uso" className="text-accent hover:underline">Termos de Uso</Link> estao sendo observadas ou ainda se nao ha violacao ou abuso das leis aplicaveis.
            </P>

            <P>
              <strong>3.9. Exclusao de usuario.</strong> A Ailum se reserva no direito de excluir determinado usuario, independente do tipo que for, caso a presente Politica ou os Termos de Uso nao sejam respeitados. Como prezamos pelo bom relacionamento com os usuarios, reconhecemos que o usuario tem o direito de buscar entender os motivos e ate contesta-los, o que pode ser feito pelo seguinte e-mail: <a href="mailto:contato@ailum.io" className="text-accent hover:underline">contato@ailum.io</a>.
            </P>
          </S>

          {/* 4 */}
          <S>
            <H2>4. Compartilhamento das Informacoes</H2>
            <P>
              <strong>4.1.</strong> Seus dados podem ser compartilhados com os seguintes parceiros e provedores de servico:
            </P>
            <ul className="list-disc pl-6 space-y-1">
              <Li><strong>Anthropic (Claude):</strong> Processamento de conversas pela IA de atendimento.</Li>
              <Li><strong>Z-API:</strong> Integracao com WhatsApp para envio e recebimento de mensagens.</Li>
              <Li><strong>Asaas:</strong> Processamento de pagamentos Pix e emissao de notas fiscais.</Li>
              <Li><strong>InfinitePay:</strong> Processamento de pagamentos por cartao de credito.</Li>
              <Li><strong>ElevenLabs:</strong> Geracao de audio para respostas por voz.</Li>
              <Li><strong>Firebase (Google Cloud):</strong> Autenticacao e sincronizacao de dados em tempo real.</Li>
              <Li><strong>Resend:</strong> Envio de e-mails transacionais.</Li>
            </ul>
            <P>
              Os dados sao compartilhados exclusivamente para a execucao dos servicos contratados. Cada provedor opera sob sua propria politica de privacidade. A Ailum nao se responsabiliza pelo tratamento de dados realizado diretamente por esses terceiros.
            </P>

            <P>
              <strong>4.2.</strong> Todos os dados, informacoes e conteudos sobre voce podem ser considerados ativos no caso de negociacoes em que a Ailum fizer parte. Portanto, nos reservamos no direito de, por exemplo, incluir seus dados dentre os ativos da empresa caso esta venha a ser vendida, adquirida ou fundida com outra. Por meio desta Politica voce concorda e esta ciente desta possibilidade.
            </P>

            <P>
              <strong>4.2.1.</strong> A empresa adquirente devera manter todas as garantias desta politica de privacidade e voce mantem todos os direitos como titular dos dados durante e apos a transferencia.
            </P>

            <P>
              <strong>4.3.</strong> A Ailum se reserva no direito de fornecer seus dados e informacoes, incluindo interacoes suas, caso seja requisitado judicialmente para tanto, ato necessario para que a empresa esteja em conformidade com as leis nacionais, ou ainda, caso voce autorize expressamente.
            </P>
          </S>

          {/* 5 */}
          <S>
            <H2>5. Seguranca das Informacoes</H2>
            <P>
              <strong>5.1.</strong> Todos os seus dados sao confidenciais e somente as pessoas com as devidas autorizacoes terao acesso a eles. Qualquer uso destes estara de acordo com a presente Politica. A Ailum empreenderera todos os esforcos razoaveis de mercado para garantir a seguranca dos nossos sistemas e dos seus dados. Nossos servidores estao localizados em diferentes locais para garantir estabilidade e seguranca, e somente podem ser acessados por meio de canais de comunicacao previamente autorizados.
            </P>

            <P>
              <strong>5.2.</strong> Adotamos medidas tecnicas e organizacionais para proteger seus dados, incluindo:
            </P>
            <ul className="list-disc pl-6 space-y-1">
              <Li>Criptografia de dados sensiveis (chaves de API, tokens de integracao);</Li>
              <Li>Isolamento de dados por tenant (cada clinica acessa apenas seus proprios dados);</Li>
              <Li>Controle de acesso por funcao (administrador, secretaria, profissional);</Li>
              <Li>Conexoes seguras (HTTPS/TLS);</Li>
              <Li>Monitoramento continuo de seguranca.</Li>
            </ul>

            <P>
              <strong>5.3.</strong> A Ailum considera a sua privacidade algo extremamente importante e fara tudo que estiver ao alcance para protege-la. Todavia, nao temos como garantir que todos os dados e informacoes sobre voce em nossa plataforma estarao livres de acessos nao autorizados, principalmente caso haja compartilhamento indevido das credenciais necessarias para acessar o nosso aplicativo. Portanto, voce e o unico responsavel por manter sua senha de acesso em local seguro e e vedado o compartilhamento desta com terceiros. Voce se compromete a notificar a Ailum imediatamente, atraves de meio seguro, a respeito de qualquer uso nao autorizado de sua conta, bem como o acesso nao autorizado por terceiros a esta.
            </P>

            <P>
              <strong>5.4.</strong> Embora a Ailum utilize medidas de seguranca para verificar vulnerabilidades e ataques para proteger o banco de dados contra divulgacoes ou vazamentos nao autorizados, voce, Usuario, entende e concorda que nao ha garantias de que as informacoes nao poderao ser acessadas, divulgadas, alteradas ou destruidas por violacao de qualquer uma das protecoes fisicas, tecnicas ou administrativas que nao sao inviolaveis de forma absoluta.
            </P>

            <P>
              <strong>5.5.</strong> Nossos servidores estao localizados no Brasil e em datacenters de parceiros tecnologicos que podem estar em outros paises. Para transferencias internacionais, adotamos salvaguardas adequadas como clausulas contratuais padrao aprovadas pela ANPD, certificacoes internacionais de protecao de dados e, quando necessario, seu consentimento especifico. Todos os fornecedores internacionais sao contratualmente obrigados a respeitar a legislacao brasileira de protecao de dados e implementar medidas de seguranca equivalentes as desta politica.
            </P>

            <P>
              <strong>5.6. Notificacoes de Incidentes:</strong> Em caso de indicios de vazamento ou acesso nao autorizado a dados de clientes dos usuarios:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>Notifique imediatamente nossa equipe de protecao de dados atraves do e-mail <a href="mailto:privacidade@ailum.io" className="text-accent hover:underline">privacidade@ailum.io</a>;</Li>
              <Li>Nossa equipe atuara prioritariamente para: (i) investigar as causas; (ii) conter o incidente; (iii) prestar suporte tecnico;</Li>
              <Li>O usuario compromete-se a colaborar com investigacoes e notificar seus clientes afetados, se exigido pela LGPD.</Li>
            </ul>
          </S>

          {/* 6 */}
          <S>
            <H2>6. Encarregado de Dados (DPO)</H2>
            <P>
              <strong>6.1.</strong> Para exercer seus direitos como titular dos dados ou para esclarecimentos sobre esta Politica de Privacidade, entre em contato com o Data Protection Officer (&quot;DPO&quot;) da Ailum, Sr. Bruno Pimentel, encarregado pelo tratamento de dados pessoais, atraves do endereco eletronico: <a href="mailto:privacidade@ailum.io" className="text-accent hover:underline">privacidade@ailum.io</a>.
            </P>

            <P>
              <strong>6.2.</strong> Voce possui os seguintes direitos garantidos pela LGPD:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li><strong>Confirmacao da existencia de tratamento:</strong> Saber se tratamos seus dados pessoais.</Li>
              <Li><strong>Acesso aos dados:</strong> Consultar quais dados pessoais tratamos sobre voce.</Li>
              <Li><strong>Correcao de dados:</strong> Solicitar correcao de dados incompletos, inexatos ou desatualizados.</Li>
              <Li><strong>Anonimizacao, bloqueio ou eliminacao:</strong> Para dados desnecessarios, excessivos ou tratados em desconformidade com a LGPD.</Li>
              <Li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e interoperavel para transferir a outro fornecedor.</Li>
              <Li><strong>Eliminacao dos dados:</strong> Solicitar exclusao dos dados tratados com base no consentimento.</Li>
              <Li><strong>Informacao sobre compartilhamento:</strong> Saber com quais entidades publicas e privadas compartilhamos seus dados.</Li>
              <Li><strong>Informacoes sobre nao consentimento:</strong> Conhecer as consequencias da negativa em fornecer dados.</Li>
              <Li><strong>Revogacao do consentimento:</strong> Retirar consentimento a qualquer momento quando esta for a base legal.</Li>
            </ul>

            <P>
              <strong>6.3.</strong> A depender da natureza da solicitacao e da relacao mantida entre o titular e a Ailum, poderao ser requisitadas informacoes adicionais para fins de validacao da identidade ou para melhor atendimento a demanda.
            </P>
          </S>

          {/* 7 */}
          <S>
            <H2>7. Governanca e Responsabilidade</H2>
            <P>
              <strong>7.1.</strong> A AILUM SOLUCOES LTDA (Ailum) atua como Controladora dos dados dos usuarios e processadora para dados de clientes atendidos pelos usuarios, sendo responsavel pelas decisoes sobre o tratamento. Mantemos registro detalhado de todas as operacoes de tratamento, incluindo:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>Finalidades do tratamento;</Li>
              <Li>Categorias de dados tratados;</Li>
              <Li>Bases legais utilizadas;</Li>
              <Li>Compartilhamentos realizados;</Li>
              <Li>Prazos de retencao aplicados.</Li>
            </ul>

            <P>
              <strong>7.2.</strong> Para atividades de tratamento de alto risco, realizamos avaliacao previa dos impactos a privacidade e implementamos medidas mitigatorias.
            </P>

            <P>
              <strong>7.3.</strong> Em caso de vazamento de dados ou incidente de seguranca:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>A ANPD sera notificada em ate 72 horas quando houver risco aos direitos dos titulares;</Li>
              <Li>Voce sera comunicado no menor prazo possivel sobre incidentes que afetem seus dados;</Li>
              <Li>Implementaremos medidas imediatas para conter e remediar o incidente;</Li>
              <Li>Forneceremos orientacoes sobre como proteger-se de possiveis consequencias.</Li>
            </ul>

            <P>
              <strong>7.4.</strong> Adotamos medidas tecnicas e organizacionais adequadas para demonstrar conformidade com a LGPD e proteger seus direitos como titular dos dados.
            </P>

            <P>
              <strong>7.5.</strong> Cada usuario devera:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>Manter sua propria Politica de Privacidade para seus pacientes e clientes;</Li>
              <Li>Obter consentimentos validos para coleta de dados;</Li>
              <Li>Notificar a Ailum sobre requisitos especificos de tratamento;</Li>
              <Li>Implementar medidas de seguranca complementares em seus atendimentos.</Li>
            </ul>

            <P>
              <strong>7.6. Proibicao de Conteudo Ilegal ou Atividades Fraudulentas:</strong> A Ailum nao tolera o uso da plataforma para atividades ilegais ou veiculacao de conteudos proibidos, incluindo, mas nao se limitando, a:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>Pornografia (especialmente envolvendo menores de idade);</Li>
              <Li>Apologia ao uso de drogas ilicitas;</Li>
              <Li>Conteudo discriminatorio, de odio ou violento;</Li>
              <Li>Violacoes de direitos de propriedade intelectual;</Li>
              <Li>Fraudes, phishing ou atividades criminosas.</Li>
            </ul>

            <P>
              <strong>7.7.</strong> A Ailum reserva-se o direito de: (i) bloquear imediatamente contas com indicios de conteudo ilegal; (ii) remover dados que violem esta Politica, sem notificacao previa; (iii) cooperar com autoridades em investigacoes relacionadas.
            </P>
          </S>

          {/* 8 */}
          <S>
            <H2>8. Atualizacoes da Politica de Privacidade</H2>
            <P>
              <strong>8.1.</strong> A Ailum se reserva no direito de alterar essa Politica quantas vezes forem necessarias, visando fornecer a voce mais seguranca, conveniencia e melhorar cada vez mais a sua experiencia. E por isso que e muito importante acessar nossa Politica periodicamente.
            </P>
            <P>
              <strong>8.2.</strong> Caso esta Politica de Privacidade seja modificada, tais alteracoes serao publicadas de forma visivel em nossas paginas e plataforma. Esta Politica e valida a partir da data de entrada dos sites no ar.
            </P>
            <P>
              Caso voce, Usuario, tenha quaisquer questoes a respeito da politica de privacidade, por favor, entre em contato com a Ailum, por meio do e-mail <a href="mailto:privacidade@ailum.io" className="text-accent hover:underline">privacidade@ailum.io</a>.
            </P>
          </S>

          {/* 9 */}
          <S>
            <H2>9. Foro</H2>
            <P>
              <strong>9.1.</strong> Este documento e regido e deve ser interpretado de acordo com as leis da Republica Federativa do Brasil. Fica eleito o Foro da Comarca de Curitiba, Parana, como o competente para dirimir quaisquer questoes porventura oriundas do presente documento, com expressa renuncia a qualquer outro, por mais privilegiado que seja.
            </P>
          </S>

          <hr className="border-border/30 my-10" />

          <div className="text-[13px] text-muted-foreground space-y-1">
            <p>Historico de versoes:</p>
            <p>Versao 1.0, 26 de marco de 2026</p>
          </div>

          <div className="mt-6 text-[13px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground/80">AILUM SOLUCOES LTDA</p>
            <p>CNPJ: 65.678.502/0001-11</p>
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
