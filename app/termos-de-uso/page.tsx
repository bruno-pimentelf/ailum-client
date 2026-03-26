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

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          &larr; Voltar para o site
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Termos de Uso</h1>
        <p className="text-[13px] text-muted-foreground mb-12">Atualizado em 26 de marco de 2026</p>

        {/* Index */}
        <nav className="rounded-xl border border-border/40 bg-card/30 px-6 py-5 mb-12">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Indice</p>
          <ol className="columns-1 sm:columns-2 gap-x-8 space-y-1.5 text-[13px] text-accent list-decimal list-inside">
            {[
              "O que e e como funciona a Plataforma",
              "Cadastro, Acesso, Uso e Exclusao",
              "Desenvolvimento e Manutencao",
              "Regras de Pagamento",
              "Vigencia e Cancelamento",
              "Propriedade Intelectual",
              "Responsabilidades da Ailum",
              "Seguranca e Protecao de Dados",
              "Confidencialidade",
              "Violacao dos Termos",
              "Abusividade no Uso de IA",
              "Direitos Autorais",
              "Disposicoes Finais",
            ].map((item, i) => (
              <li key={i} className="hover:underline cursor-default">{item}</li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          <P>
            Estes Termos de Uso (&quot;Termo&quot;) regem a contratacao da plataforma Ailum, criada e desenvolvida pela pessoa juridica <strong>AILUM SOLUCOES LTDA</strong>, inscrita no CNPJ sob o n. <strong>65.678.502/0001-11</strong>, empresa com sede na Rua Mateus Leme, 5352, Sao Lourenco, na cidade de Curitiba (PR), CEP n. 82.210-290, endereco eletronico: contato@ailum.io, denominada (&quot;Ailum&quot;), pelos Usuarios que desejem ter acesso ao seu conteudo e as suas funcionalidades.
          </P>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4 my-6">
            <p className="text-[12px] font-bold text-foreground/90 uppercase leading-[1.8]">
              A CONCORDANCIA AO PRESENTE TERMO E ABSOLUTAMENTE INDISPENSAVEL A UTILIZACAO E ACESSO A PLATAFORMA PELOS USUARIOS. AO ACESSAR E UTILIZAR A PLATAFORMA, O USUARIO DECLARA ESTAR DE ACORDO COM ESTE TERMO, RESPONSABILIZANDO-SE INTEGRALMENTE POR TODOS E QUAISQUER ATOS QUE PRATICAR AO LONGO DOS ACESSOS A PLATAFORMA, BEM COMO EM RELACAO AOS DEMAIS SERVICOS E APLICACOES A ELA RELACIONADOS.
            </p>
          </div>

          <P>
            O Usuario devera ler, certificar-se de haver entendido e concordar com todas as condicoes estabelecidas neste Termo, antes da contratacao da Plataforma Ailum.
          </P>

          {/* 1 */}
          <S>
            <H2>1. O que e e como funciona a Plataforma</H2>
            <P>
              <strong>1.1. Plataforma:</strong> A Ailum e uma solucao de Software as a Service (SaaS) desenvolvida para operar em conjunto com a tecnologia do WhatsApp, oferecendo funcionalidades de atendimento automatizado por inteligencia artificial, agendamento de consultas, cobranca via Pix, geracao de notas fiscais (NFS-e), gestao de funis de vendas e leads, gerenciamento de contatos e pacientes, mensagens automatizadas com audio gerado por IA, calendario integrado por profissional, dashboard de acompanhamento, templates de mensagem, sistema de triggers e automacoes, playground de teste da IA, e demais funcionalidades em desenvolvimento (&quot;Plataforma&quot;). O funcionamento da Plataforma esta diretamente vinculado a disponibilidade e ao correto funcionamento do servico do WhatsApp.
            </P>
            <P>
              <strong>1.2. Conteudo:</strong> Atraves do uso da Plataforma, o Usuario pode integrar um ou mais numeros que possui conta no WhatsApp, a depender do plano contratado, para que consiga profissionalizar o atendimento e organizacao de seus pacientes e potenciais pacientes, alem de ter mais controle sobre o desempenho de seus colaboradores que utilizam a plataforma. O Usuario autoriza que dados seus e de seus contatos sejam importados e transacionados na plataforma.
            </P>
            <P>
              <strong>1.2.1.</strong> Os Usuarios terao direito a acessar a Plataforma exclusivamente mediante a contratacao de um dos planos comercializados, mediante os valores exibidos diretamente na Plataforma ou atraves de consulta ao setor comercial da Ailum.
            </P>
            <P>
              <strong>1.2.2.</strong> O acesso ao Conteudo contratado pelo usuario e pessoal e intransferivel e nao podera, sob nenhuma circunstancia, ser revendido pelo Usuario a terceiros.
            </P>
            <P>
              <strong>1.3. Suporte ao Usuario:</strong> A Ailum prestara suporte ao Usuario no que diz respeito a eventuais problemas apresentados pela Plataforma, assim como na solucao de duvidas e orientacao quanto a utilizacao da Plataforma e de suas funcionalidades. O suporte devera ser solicitado pelo Usuario por meio dos canais oficiais da Ailum, sendo certo que a equipe da Ailum respondera o contato do Usuario da forma mais breve possivel.
            </P>
            <P>
              <strong>1.4. Limitacoes do Suporte:</strong> O Usuario reconhece e concorda que, por se tratar de uma solucao tecnologica que depende da integracao com sistemas e servicos de terceiros, como o WhatsApp, a resolucao de problemas podera nao ocorrer de forma imediata. A Ailum envidara seus melhores esforcos para solucionar quaisquer questoes no menor prazo possivel, mas nao garante prazos especificos para a resolucao de problemas que envolvam dependencias externas.
            </P>
            <P>
              <strong>1.5. Dependencia de Terceiros:</strong> O Usuario reconhece e concorda que a Ailum esta diretamente vinculada ao funcionamento adequado de servicos de terceiros, incluindo, mas nao se limitando ao WhatsApp (via Z-API), processadores de pagamento (Asaas, InfinitePay), provedores de inteligencia artificial (Anthropic Claude) e servicos de geracao de voz (ElevenLabs). A Ailum nao se responsabiliza por falhas, interrupcoes, instabilidades, alteracoes ou indisponibilidades nos servicos de terceiros, comprometendo-se, contudo, a manter o Usuario informado sobre quaisquer impactos relevantes.
            </P>
          </S>

          {/* 2 */}
          <S>
            <H2>2. Cadastro, Acesso, Uso e Exclusao da Plataforma</H2>
            <P>
              <strong>2.1. Acesso e Cadastro:</strong> A Plataforma sera disponibilizada somente para aqueles que tenham capacidade legal para contratar nos termos da Lei brasileira (&quot;Usuarios&quot;). Nao poderao utilizar a Plataforma os Usuarios que nao tenham esta capacidade legal, os menores de idade ou Usuarios cujo acesso a Plataforma ja tenha sido previamente suspenso ou cancelado por qualquer justo motivo julgado pela Plataforma.
            </P>
            <P>
              <strong>2.2.</strong> Para acessar a Plataforma e utilizar suas funcionalidades e necessario que o Usuario seja cadastrado na Plataforma. Para cadastrar-se, o Usuario fornecera determinados dados e informacoes, de maneira exata e verdadeira, fornecendo tambem, caso necessario e expressamente requerido pela Ailum, documentos que comprovem a sua identidade e a sua capacidade de contratar. Outros documentos e informacoes complementares poderao ser solicitados posteriormente pela Ailum para finalizacao ou manutencao do cadastro do Usuario na Plataforma. O Usuario assume o compromisso de manter as informacoes incluidas no cadastro atualizadas.
            </P>
            <P>
              <strong>2.3.</strong> A documentacao fornecida pelo Usuario no momento do cadastro devera ser propria, atual, legal e vigente. A Ailum nao assume qualquer responsabilidade por prejuizos decorrentes de informacoes falsas ou imprecisas, as quais serao de exclusiva responsabilidade dos Usuarios. Tambem e proibido ao Usuario utilizar numeros telefonicos e/ou de WhatsApp que nao sejam de sua propriedade e/ou titularidade, sem autorizacao expressa e escrita do titular desses direitos.
            </P>
            <P>
              <strong>2.4.</strong> Com a conclusao do cadastro, o Usuario sera titular de uma conta que somente podera ser acessada mediante senha pessoal e intransferivel. O Usuario devera informar o seu e-mail, sendo certo que uma senha provisoria podera ser fornecida pela Ailum para acesso a Plataforma, a qual devera ser posteriormente alterada pelo Usuario. Caso a Ailum detecte alguma conta criada a partir de informacoes falsas, por Usuarios que nao possuam capacidade legal ou permissao para se cadastrar na Plataforma, ou que, de qualquer modo, violem este Termo, a respectiva conta podera ser suspensa e deletada.
            </P>
            <P>
              <strong>2.5.</strong> Desde ja, o Usuario se compromete a manter as suas informacoes de cadastro atualizadas. O Usuario tambem concorda que ira manter o seu login e senha seguros e fora do alcance de terceiros, nao permitindo que a sua conta na Plataforma seja usada por outras pessoas a nao ser aquelas envolvidas no seu negocio e cadastradas como seus usuarios na aba interna da Plataforma dedicada a esse cadastro. Dessa forma, o Usuario se responsabiliza por todas as acoes realizadas em sua conta. A Ailum nao se responsabiliza por operacoes efetuadas atraves do cadastro dos Usuarios na Plataforma. Caso perceba o uso ou o acesso nao autorizado do seu cadastro, o Usuario devera comunicar tal fato a Ailum imediatamente para fins de suspensao do cadastro e resolucao da questao.
            </P>
            <P>
              <strong>2.6.</strong> Com a conclusao de seu cadastro e adesao a este Termo, o Usuario podera usar a Plataforma e usufruir de suas funcionalidades, conforme previsto neste Termo.
            </P>
            <P>
              <strong>2.7.</strong> E absolutamente proibida qualquer acao ou uso de dispositivo, software, ou outro meio com o proposito de interferir nas atividades e operacoes da Plataforma. Qualquer intromissao, atividade ou tentativa de violacao, incluindo, mas sem limitacao, as que versem sobre direito de propriedade intelectual e/ou as proibicoes estipuladas neste Termo, serao passiveis da adocao das medidas legais pertinentes, inclusive de natureza criminal.
            </P>
            <P>
              <strong>2.8. Exclusao e Suspensao do Cadastro e do Acesso a Plataforma:</strong> A Ailum se reserva no direito de suspender ou cancelar, a qualquer momento, o acesso de determinado Usuario a Plataforma em caso de suspeita de fraude, obtencao de beneficio ou vantagem de forma ilicita, pelo nao cumprimento de quaisquer condicoes previstas neste Termo ou na legislacao aplicavel. Nesses casos, nao sera devida qualquer indenizacao ao respectivo Usuario e a Ailum podera promover a competente acao de regresso, se necessario, bem como adotar quaisquer outras medidas necessarias para resguardar os seus interesses.
            </P>
            <P>
              <strong>2.9. Nao concorrencia:</strong> A Ailum resguarda o seu direito de excluir usuarios identificados como concorrentes diretos e indiretos de sua atividade, que utilizem a plataforma com o objetivo de replicar, copiar e/ou plagiar o conteudo ou o funcionamento da Plataforma. Nesta hipotese nao sera devida qualquer indenizacao, restituicao ou reembolso de valores pagos, sem prejuizo ainda de incorrer nas penas da lei, se cabiveis.
            </P>
            <P>
              <strong>2.9.1.</strong> A Ailum podera excluir da Plataforma os Usuarios que nao atuem em consonancia com este Termo ou a legislacao brasileira aplicavel, independentemente de previa notificacao, oportunidade em que serao excluidos os cadastros e acessos do Usuario a Plataforma, sem prejuizo da cobranca de todos os valores devidos pelo Usuario em decorrencia deste Termo e do uso da Plataforma.
            </P>
          </S>

          {/* 3 */}
          <S>
            <H2>3. Desenvolvimento e Manutencao da Plataforma</H2>
            <P>
              <strong>3.1.</strong> Cabe a Ailum desenvolver e manter atualizado o ambiente da Plataforma, para que os Usuarios possam ter acesso as funcionalidades da Plataforma. A Ailum podera interromper a disponibilidade da Plataforma, a qualquer tempo, em paradas programadas, sem a necessidade de aviso previo aos Usuarios, esforcando-se, contudo, para que tais paradas sejam realizadas fora do horario comercial. A Ailum nao e obrigada a manter o ambiente da Plataforma disponivel indefinidamente, nao havendo qualquer tipo de responsabilidade perante os Usuarios em caso de uma eventual indisponibilidade ou necessidade de manutencao nao programada.
            </P>
            <P>
              <strong>3.2.</strong> A Ailum nao garante o acesso e uso continuado ou ininterrupto da Plataforma. O ambiente da Plataforma pode eventualmente nao estar disponivel devido a dificuldades tecnicas ou falhas de Internet, ou por qualquer outra circunstancia alheia a vontade da Ailum e, em tais casos, a Ailum procurara restabelecer a acessibilidade a Plataforma com a maior brevidade possivel, sem que isso possa imputar algum tipo de responsabilidade.
            </P>
          </S>

          {/* 4 */}
          <S>
            <H2>4. Regras de Pagamento da Plataforma</H2>
            <P>
              <strong>4.1. Pagamento:</strong> O acesso ao Conteudo e as funcionalidades da Plataforma ocorrera mediante pagamento (&quot;Pagamento&quot;) que sera feito pelo Usuario de acordo com o valor do plano escolhido, sendo certo que, somente apos efetuar o Pagamento, o Usuario pode exigir a emissao da nota fiscal pela Ailum.
            </P>
            <P>
              <strong>4.2. Meios de Pagamento:</strong> Os Pagamentos efetuados pelos Usuarios deverao ser realizados dentro da propria Plataforma ou em links e paginas especificas disponibilizados pela Ailum.
            </P>
            <P>
              <strong>4.3. Confirmacao e Processamento dos Pagamentos:</strong> O processamento das informacoes de pagamento e a confirmacao do pagamento sera realizado por sistemas de terceiros (Asaas e InfinitePay) (&quot;Empresas de Pagamento&quot;).
            </P>
            <P>
              <strong>4.4.</strong> A Ailum nao podera intervir e nao sera responsavel, de qualquer maneira, pelos atos praticados pelas Empresas de Pagamento, assim como pelos resultados da relacao dos Usuarios com as Empresas de Pagamento, uma vez que estas administram suas operacoes de forma independente, sem qualquer intermediacao da Plataforma.
            </P>
            <P>
              <strong>4.5.</strong> Em caso de problemas nos pagamentos, a Ailum podera, a qualquer tempo, suspender o acesso do Usuario a Plataforma, bem como promover a sua exclusao da Plataforma, independentemente de aviso ou notificacao previa e sem prejuizo da cobranca dos valores devidos, adotando as medidas judiciais e extrajudiciais cabiveis. Em caso de atraso, a liberacao do acesso a Plataforma somente acontecera mediante o pagamento de todos os valores em atraso.
            </P>
            <P>
              <strong>4.6. Codigo Promocional:</strong> Caso a Ailum crie algum codigo promocional ou cupom de desconto, este deve ser usado de forma legal e adequada, pelo respectivo Usuario, para a finalidade para o qual foi criado, seguindo todas as condicoes e termos aplicaveis. O codigo promocional podera ser cancelado pela Ailum, independentemente de comunicacao neste sentido.
            </P>
          </S>

          {/* 5 */}
          <S>
            <H2>5. Vigencia, Renovacao e Cancelamento</H2>
            <P>
              <strong>5.1.</strong> A contratacao da Plataforma tera prazo de vigencia em conformidade com o plano escolhido pelo Usuario, em conformidade com a periodicidade que venha a ser comercializada pela Ailum.
            </P>
            <P>
              <strong>5.2.</strong> Ao optar por um plano de maior duracao, como o plano anual, o Usuario compromete-se a cumprir integralmente o periodo contratado, sendo responsavel pelo pagamento total do valor pactuado, ainda que opte por nao utilizar a Plataforma durante todo o periodo e ainda que tenha optado pelo parcelamento no momento da contratacao.
            </P>
            <P>
              <strong>5.3.</strong> A nao utilizacao da Plataforma pelo Usuario e/ou a solicitacao de cancelamento no prazo de vigencia do plano contratado pelo Usuario nao enseja qualquer dever da Ailum de realizar a devolucao do pagamento ja efetuado pelo Usuario, tendo em vista que o pagamento e feito de forma antecipada. Isso significa que, mediante a solicitacao de cancelamento, o Usuario continuara tendo acesso a Plataforma ate o final do periodo contratado e, ao termino deste, a cobranca de novos valores sera interrompida pela Ailum.
            </P>
            <P>
              <strong>5.4. Cancelamento e Reembolso:</strong> O Usuario podera solicitar o cancelamento do seu plano a qualquer momento, permanecendo com acesso a Plataforma ate o final do periodo ja pago. Nao havera reembolso de valores ja pagos, salvo em casos de falha comprovada da Plataforma que impeca seu uso por periodo igual ou superior a 7 dias de forma ininterrupta, situacao em que o cancelamento sera processado e o reembolso sera efetuado de forma proporcional ao periodo restante do contrato.
            </P>
          </S>

          {/* 6 */}
          <S>
            <H2>6. Direitos de Propriedade Intelectual</H2>
            <P>
              <strong>6.1.</strong> Todos os direitos e funcionalidades da Plataforma sao de propriedade intelectual exclusiva da Ailum, especialmente no que diz respeito as solucoes, ferramentas, imagens, textos, prompts e materiais, assim como layouts, software, codigos, bases de dados, graficos, artigos, fotografias e demais conteudos constantes da Plataforma (&quot;Conteudo da Plataforma&quot;).
            </P>
            <P>
              <strong>6.2.</strong> O Conteudo da Plataforma e protegido pela lei de direitos autorais e de propriedade intelectual. Qualquer uso nao autorizado da Plataforma sera considerado violacao dos direitos autorais e de propriedade intelectual da Ailum.
            </P>
            <P>
              <strong>6.3.</strong> O licenciamento de uso e acesso ao ambiente da Plataforma, pela Ailum, nao concede ao Usuario quaisquer direitos definitivos de propriedade intelectual sobre a Plataforma, bem como quaisquer outros ativos de propriedade intelectual de titularidade da Ailum na data de aceite do presente Termo, ou que venham a ser desenvolvidos pela Ailum no ambito deste Termo, especialmente quanto a Plataforma, marcas, materiais, nomes comerciais, nomes de dominio e demais sinais distintivos da Ailum, assim como os programas, banco de dados, redes e demais arquivos, sendo vedado ao Usuario efetuar pedido de registro, em territorio nacional ou no exterior, em seu nome ou em nome de terceiro, referente a qualquer propriedade industrial, software e/ou direito autoral que se relacione ou seja similar a Plataforma, ao Conteudo da Plataforma, ou a quaisquer outros ativos de propriedade intelectual de titularidade da Ailum.
            </P>
            <P>
              <strong>6.4.</strong> O Usuario desde ja reconhece que eventuais invencoes e melhorias que venham a ser sugeridas por ele, no ambito da execucao do presente Termo, para o ambiente da Plataforma, sejam elas descobertas ou projetadas, passiveis de registro como propriedade intelectual ou nao, permanecerao de propriedade e de beneficio exclusivo da Ailum.
            </P>
            <P>
              <strong>6.5.</strong> E proibido que o Usuario faca o download do Conteudo, design, inteligencia de software ou qualquer ferramenta desenvolvida e protegida por direitos autorais da Plataforma com o intuito de armazena-lo em banco de dados para utilizar por si proprio ou ainda para oferecer a terceiros, gratuita ou onerosamente, ou constituir servico que possa concorrer, de qualquer maneira, com a Plataforma, com atividades realizadas pela tecnologia disponivel, ou atentar contra os direitos e a protecao dos dados dos demais Usuarios.
            </P>
          </S>

          {/* 7 */}
          <S>
            <H2>7. Atuacao e Limite de Responsabilidades da Ailum</H2>
            <P>
              <strong>7.1.</strong> O Usuario e exclusivamente responsavel pelo uso das ferramentas e funcionalidades oferecidas pela Plataforma, pela autenticidade e correcao dos dados fornecidos para uso da Plataforma, bem como por sua conduta ao longo da utilizacao, devendo respeitar a boa-fe, as regras deste Termo e a legislacao aplicavel. A responsabilidade pelo comportamento dos usuarios adicionados pelo Usuario na plataforma sao de sua responsabilidade exclusiva.
            </P>
            <P>
              <strong>7.2.</strong> A Ailum nao sera, em hipotese alguma, responsabilizada por danos diretos ou indiretos, danos morais ou lucros cessantes que resultem: de atrasos, por parte do Usuario, na apresentacao de documentos e informacoes necessarias ao seu cadastro e utilizacao da Plataforma; de omissoes ou extravio de documentos e informacoes do Usuario para fins de utilizacao da Plataforma; do fornecimento de informacoes inexatas, incompletas, falsas ou fraudulentas que ocasionem quaisquer prejuizos ao Usuario.
            </P>
            <P>
              <strong>7.3. Responsabilidade pelo Uso da Inteligencia Artificial:</strong> O Usuario reconhece e concorda que a Plataforma da Ailum inclui funcionalidades de atendimento automatizado baseadas em inteligencia artificial, que operam de acordo com as configuracoes e instrucoes fornecidas pelo proprio Usuario. O Usuario e o unico responsavel pelo conteudo das interacoes realizadas por meio da inteligencia artificial, incluindo, mas nao se limitando a: mensagens enviadas a pacientes, leads e contatos; quaisquer informacoes e respostas fornecidas pela inteligencia artificial ou atraves de automacoes; agendamentos realizados e cobranças geradas pela IA.
            </P>
            <P>
              <strong>7.4. Assuncao de Risco pelo Usuario:</strong> O Usuario concorda expressamente que e responsavel por monitorar, revisar e supervisionar o uso da inteligencia artificial, assumindo integralmente os riscos relacionados ao seu uso, incluindo, mas nao se limitando a:
            </P>
            <ul className="list-disc pl-6 space-y-1">
              <Li>Perda de leads ou oportunidades de negocio decorrentes de respostas automaticas inadequadas;</Li>
              <Li>Envio de informacoes equivocadas, incompletas ou desatualizadas aos pacientes ou contatos;</Li>
              <Li>Agendamentos incorretos ou cobranças indevidas geradas pela IA;</Li>
              <Li>Qualquer comportamento inesperado ou indesejado do agente de inteligencia artificial.</Li>
            </ul>
            <P>
              <strong>7.5.</strong> A Ailum nao sera, em hipotese alguma, responsavel por qualquer perda ou dano resultante do uso da inteligencia artificial, cabendo ao Usuario configurar, revisar e ajustar o comportamento do agente de atendimento conforme necessario.
            </P>
            <P>
              <strong>7.6.</strong> O Usuario reconhece que, embora a equipe da Ailum possa fornecer orientacoes e suporte para estruturar as instrucoes dos agentes de atendimento configurados pelo Usuario, tal assistencia nao isenta o Usuario da responsabilidade exclusiva de revisar, fiscalizar e ajustar o comportamento desses agentes antes de iniciar sua operacao.
            </P>
            <P>
              <strong>7.7.</strong> Nao obstante as disposicoes acima, em qualquer hipotese, a responsabilidade da Ailum, no ambito deste Termo, e limitada ao valor total recebido pela Ailum em decorrencia da contratacao da Plataforma pelo Usuario.
            </P>
            <P>
              <strong>7.8.</strong> E possivel que a Plataforma possa conter links para sites e aplicativos de terceiros, assim como ter tecnologias integradas com plataformas de terceiros. Isso nao implica, de maneira alguma, que a Ailum endossa, verifica, garante ou possui qualquer ligacao com os proprietarios desses sites ou aplicativos, nao sendo responsavel pelo seu conteudo, precisao, politicas, praticas ou opinioes. A Ailum recomenda que o Usuario leia os termos de uso e politicas de privacidade de cada site de terceiros ou servico que venha a visitar ou utilizar. A Ailum nao sera responsavel por quaisquer danos decorrentes de questoes relacionadas a servicos ou plataformas de terceiros.
            </P>
          </S>

          {/* 8 */}
          <S>
            <H2>8. Seguranca da Informacao e Protecao de Dados Pessoais</H2>
            <P>
              <strong>8.1.</strong> Para ter acesso ao ambiente da Plataforma e usufruir de seu conteudo e funcionalidades, os Usuarios deverao fornecer determinados dados e informacoes, sendo que alguns deles podem se tratar de dados pessoais. Para mais informacoes sobre a privacidade dos dados pessoais dos Usuarios, o Usuario devera acessar a <Link href="/politicas-de-privacidade" className="text-accent hover:underline">Politica de Privacidade</Link> da Ailum.
            </P>
            <P>
              <strong>8.2.</strong> Ao realizar qualquer atividade de tratamento de dados pessoais, a Ailum se compromete a:
            </P>
            <ul className="list-[upper-alpha] pl-6 space-y-1">
              <Li>Aplicar as devidas medidas fisicas, tecnicas e organizacionais visando assegurar a integridade, a disponibilidade e a confidencialidade dos dados colocados sob sua guarda e responsabilidade, nos termos da legislacao aplicavel;</Li>
              <Li>Adotar medidas tecnicas e administrativas de seguranca da informacao para evitar o uso indevido e nao autorizado de dados pessoais;</Li>
              <Li>Garantir integridade e seguranca dos dados pessoais e a transparencia sobre o tratamento em relacao ao titular, bem como atender as suas requisicoes, quando possivel;</Li>
              <Li>Durante o tratamento de dados pessoais, a Ailum se responsabiliza pela manutencao de registro escrito das atividades de tratamento e pela adocao de padroes de seguranca sustentados em tecnologias disponiveis no mercado.</Li>
            </ul>
            <P>
              <strong>8.3. Consentimento para Compartilhamento de Dados:</strong> Ao utilizar a Plataforma, o Usuario consente expressamente que seus dados pessoais, conforme descritos na Politica de Privacidade da plataforma, possam ser compartilhados com terceiros, quando necessario, para a plena execucao e finalidade dos servicos oferecidos. Este compartilhamento sera realizado de forma compativel com as finalidades descritas neste Termo de Uso e na Politica de Privacidade.
            </P>
            <P>
              <strong>8.3.1.</strong> A Ailum utiliza Z-API para integracao com WhatsApp, Anthropic Claude para processamento de inteligencia artificial, Asaas e InfinitePay para processamento de pagamentos, ElevenLabs para geracao de voz, e Firebase (Google Cloud) para sincronizacao de dados em tempo real, como parte de sua infraestrutura.
            </P>
            <P>
              <strong>8.4.</strong> Os dados poderao ser compartilhados com terceiros, incluindo, mas nao se limitando a parceiros de negocios, prestadores de servicos, fornecedores, consultores, Empresas de Pagamento, Usuarios, entre outros, para os seguintes fins:
            </P>
            <ul className="list-[upper-alpha] pl-6 space-y-1">
              <Li>Prestacao dos servicos disponibilizados pela plataforma;</Li>
              <Li>Melhoria, personalizacao e suporte ao uso da plataforma;</Li>
              <Li>Cumprimento de obrigacoes legais, contratuais ou regulatorias;</Li>
              <Li>Realizacao de atividades de marketing e comunicacao.</Li>
            </ul>
            <P>
              <strong>8.5.</strong> Caso a Ailum seja destinataria de qualquer ordem judicial ou comunicacao oficial que determine o fornecimento ou divulgacao de dados pessoais tratados em razao deste Termo, devera notificar o respectivo Usuario sobre o ocorrido, mas esse declara ter ciencia quanto a obrigatoriedade legal de fornecimento dos dados.
            </P>
            <P>
              <strong>8.6.</strong> Na ocorrencia de qualquer incidente de seguranca que envolva os dados pessoais do Usuario, tratados em razao da presente relacao contratual, a Ailum seguira um plano estruturado por ela propria, a fim de cientificar o Usuario e adotar as devidas medidas de mitigacao.
            </P>
            <P>
              <strong>8.7.</strong> Ao termino da relacao contratual com o Usuario, por qualquer motivo, a Ailum, a seu exclusivo criterio, ou para cumprimento de obrigacao legal ou regulatoria, ou em exercicio regular de seus direitos, podera armazenar, eliminar, anonimizar, e/ou bloquear o acesso aos dados pessoais fornecidos pelo respectivo Usuario, em carater definitivo ou nao.
            </P>
            <P>
              <strong>8.8. Direitos dos Titulares de Dados:</strong> O Usuario e seus pacientes, cujos dados pessoais sejam tratados na Plataforma, possuem o direito de acessar, corrigir, limitar, portar e solicitar a exclusao de seus dados pessoais, de acordo com a legislacao aplicavel (Lei Geral de Protecao de Dados - LGPD). O Usuario e responsavel por obter o consentimento dos titulares de dados que forem inseridos na Plataforma, garantindo que eles sejam informados sobre o tratamento de seus dados.
            </P>
            <P>
              <strong>8.9.</strong> O Usuario reconhece e concorda que a Ailum podera compartilhar determinados dados e informacoes dos Usuarios e de suas interacoes na Plataforma com servicos de terceiros atraves de interfaces de programacao de aplicativos (APIs), incluindo, mas nao se limitando, a Anthropic e outros provedores de servicos de inteligencia artificial, para o processamento de respostas e funcionalidades oferecidas na Plataforma.
            </P>
            <P>
              <strong>8.10.</strong> Ao utilizar a Plataforma, o Usuario consente expressamente com o compartilhamento de dados com plataformas de terceiros atraves de API, para fins de execucao dos servicos contratados e melhoria da experiencia na Plataforma.
            </P>
          </S>

          {/* 9 */}
          <S>
            <H2>9. Confidencialidade</H2>
            <P>
              <strong>9.1.</strong> Todas as informacoes fornecidas pelo Usuario a Ailum, que estejam relacionadas, direta ou indiretamente, ao presente Termo, serao tratadas com o mais absoluto sigilo e a mais rigorosa confidencialidade, de modo a evitar, por qualquer meio ou forma, o seu conhecimento e/ou utilizacao por parte de terceiros, seja durante a vigencia deste Termo, ou por 1 (um) ano apos o seu termino (&quot;Informacoes Confidenciais&quot;).
            </P>
            <P>
              <strong>9.2.</strong> A Ailum podera divulgar Informacoes Confidenciais para seus proprios colaboradores e/ou prepostos que tenham a efetiva e comprovada necessidade de conhecer tais informacoes, bem como devera informa-los da existencia de normas, politicas internas e/ou acordos aplicaveis, e que os Usuarios estarao sujeitos as obrigacoes de confidencialidade previstas no presente Termo.
            </P>
          </S>

          {/* 10 */}
          <S>
            <H2>10. Violacao dos Termos de Uso</H2>
            <P>
              <strong>10.1.</strong> Sem prejuizo de outras medidas, a Ailum podera advertir, suspender ou cancelar, temporaria ou definitivamente, a conta de um Usuario da Plataforma, a qualquer tempo e independentemente de previo aviso ou notificacao, e iniciar as acoes legais cabiveis, nas seguintes hipoteses:
            </P>
            <ul className="list-disc pl-6 space-y-1">
              <Li>Se o Usuario violar qualquer dispositivo deste Termo;</Li>
              <Li>Se o Usuario atrasar o pagamento de valores devidos;</Li>
              <Li>Se o Usuario praticar atos fraudulentos ou dolosos;</Li>
              <Li>Se o Usuario tentar violar a seguranca da Plataforma;</Li>
              <Li>Uso abusivo da inteligencia artificial, conforme definido na Clausula 11;</Li>
              <Li>Se qualquer informacao fornecida pelo Usuario estiver incorreta, desatualizada ou for inveridica;</Li>
              <Li>Se a Ailum entender que a atitude do Usuario tenha causado ou tenha a potencialidade de causar algum dano a terceiros ou a si propria.</Li>
            </ul>
          </S>

          {/* 11 */}
          <S>
            <H2>11. Abusividade no Uso de Funcionalidades de IA</H2>
            <P>
              <strong>11.1.</strong> O Usuario reconhece e concorda que a utilizacao das conversas de inteligencia artificial deve ocorrer de forma responsavel, sendo vedada e caracterizada como violacao destes Termos de Uso, qualquer pratica que tenha como objetivo manipular, burlar ou abusar das funcionalidades oferecidas, incluindo, mas nao se limitando a:
            </P>
            <ul className="list-disc pl-6 space-y-1">
              <Li><strong>11.1.1.</strong> Transacionar mensagens em alta frequencia e volume com o proposito de consumir creditos de maneira artificial;</Li>
              <Li><strong>11.1.2.</strong> Manter conversas que, em volume, frequencia ou duracao, excedam significativamente o padrao medio de utilizacao da Plataforma pelos demais usuarios, caracterizando uso abusivo das funcionalidades de inteligencia artificial e resultando em custos desproporcionais para a Ailum;</Li>
              <Li><strong>11.1.3.</strong> Utilizar sistemas automatizados ou outros meios que resultem em consumo excessivo de conversas, em desconformidade com o uso normal e esperado de um atendimento humano.</Li>
            </ul>
            <P>
              <strong>11.2.</strong> A Ailum reserva-se o direito de monitorar o uso das conversas de inteligencia artificial e, a seu exclusivo criterio, adotar medidas preventivas ou corretivas, sem direito de reembolso ou devolucao de valores, em caso de uso indevido da Plataforma pelo Usuario, incluindo, mas nao se limitando a realizar:
            </P>
            <ul className="list-disc pl-6 space-y-1">
              <Li><strong>11.2.1.</strong> O bloqueio temporario ou definitivo do acesso do Usuario as funcionalidades de inteligencia artificial;</Li>
              <Li><strong>11.2.2.</strong> A suspensao ou cancelamento da conta do Usuario;</Li>
              <Li><strong>11.2.3.</strong> A cobranca de valores adicionais pelos creditos consumidos de forma abusiva.</Li>
            </ul>
            <P>
              <strong>11.3.</strong> Nos casos em que for detectado o uso abusivo ou fraudulento das conversas de inteligencia artificial, a Ailum podera notificar o Usuario para que apresente justificativa ou esclarecimento. No entanto, a decisao final sobre a aplicacao de medidas preventivas ou corretivas sera exclusiva da Ailum.
            </P>
            <P>
              <strong>11.4.</strong> O Usuario indenizara a Ailum por qualquer demanda promovida por outros Usuarios ou quaisquer terceiros, decorrentes de suas atividades na Plataforma, por seu descumprimento deste Termo, ou pela comprovada violacao de qualquer lei ou direitos de terceiro.
            </P>
          </S>

          {/* 12 */}
          <S>
            <H2>12. Dos Direitos Autorais</H2>
            <P>
              <strong>12.1.</strong> A Ailum concede ao Usuario uma licenca limitada, temporaria, nao exclusiva, nao transferivel, revogavel e destinada a uso pessoal para usar a presente Plataforma, somente para que o Usuario possa usufruir dos Servicos e cumprir com as suas obrigacoes dispostas nestes Termos de Uso.
            </P>
            <P>
              <strong>12.2.</strong> Todos os direitos relativos a Plataforma e suas funcionalidades sao licenciados para titularidade da Ailum, inclusive no que diz respeito aos seus textos, imagens, layouts, software, codigos, bases de dados, graficos, artigos, fotografias, contratos e demais conteudos produzidos direta ou indiretamente pela Ailum (&quot;Conteudo&quot;). O Conteudo da Ailum e protegido pela lei de direitos autorais e de propriedade intelectual, portanto, e expressamente proibido pelo Usuario:
            </P>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
              <Li>Usar, copiar, reproduzir, modificar, traduzir, publicar, transmitir, distribuir, executar, fazer o upload, exibir, licenciar, vender ou explorar e fazer engenharia reversa do Conteudo da Ailum, para qualquer finalidade, sem o consentimento previo e expresso da Ailum;</Li>
              <Li>Vender, alugar, licenciar, sublicenciar, emprestar, caucionar ou transferir, de qualquer maneira que seja, a totalidade ou parte da licenca de uso da Plataforma Ailum;</Li>
              <Li>Efetuar modificacoes, acrescimos ou derivacoes em qualquer porcao dos ativos que compoem o Conteudo da Ailum;</Li>
              <Li>Fazer engenharia reversa, descompilar ou desmontar a plataforma, ou qualquer outra medida que possibilite o acesso, ainda que parcial, ao codigo fonte da Plataforma Ailum;</Li>
              <Li>Remover, ocultar ou alterar quaisquer avisos de direitos autorais, marcas comerciais ou outros avisos de propriedade intelectual, legendas afixadas ou contidas em qualquer porcao da Ailum.</Li>
            </ul>
            <P>
              <strong>12.3.</strong> O Usuario reconhece que todos os prompts, fluxos de atendimento, funis de vendas e automacoes configurados na Plataforma sao de propriedade exclusiva da Ailum, que podera utiliza-los, adapta-los, modifica-los e comercializa-los, garantindo sempre a anonimizacao de quaisquer dados pessoais inseridos pelo Usuario.
            </P>
            <P>
              <strong>12.4.</strong> O Usuario nao possui qualquer direito de propriedade intelectual sobre os agentes, prompts, fluxos de atendimento ou automacoes criadas na Plataforma, mesmo que tenha contribuido diretamente para sua configuracao ou desenvolvimento.
            </P>
          </S>

          {/* 13 */}
          <S>
            <H2>13. Disposicoes Finais</H2>
            <P>
              <strong>13.1. Cookies:</strong> O Usuario declara que esta ciente e de acordo com a utilizacao de Cookies pela Ailum em seu navegador, sabendo que a qualquer momento podera adaptar suas preferencias acessando os links apropriados na Plataforma ou mesmo enviando um e-mail para contato@ailum.io.
            </P>
            <P>
              <strong>13.2. Acordo:</strong> Este Termo constitui o acordo integral entre as Partes, relativamente ao acesso e uso da Plataforma, e prevalece sobre quaisquer acordos anteriores.
            </P>
            <P>
              <strong>13.3. Alteracoes:</strong> Este Termo podera ser revisto e atualizado periodicamente pela Ailum, que podera altera-lo, excluindo, modificando ou inserindo clausulas ou condicoes, a seu exclusivo criterio.
            </P>
            <P>
              <strong>13.4.</strong> Caso o Usuario nao concorde com as alteracoes no Termo de Uso tem o pleno e geral direito de rejeita-las, mas isso significara que o Usuario nao podera mais ter acesso e fazer parte da Plataforma e de suas funcionalidades. Se, de qualquer maneira, o Usuario utilizar a Plataforma apos alteracoes deste Termo, isso significara que o Usuario concordou com todas as modificacoes realizadas.
            </P>
            <P>
              <strong>13.5.</strong> Em caso de conflito entre as versoes antigas deste Termo e as novas versoes, as versoes posteriores deverao prevalecer.
            </P>
            <P>
              <strong>13.6. Tributos:</strong> Os tributos de qualquer natureza relativos a celebracao do presente Termo sao de exclusiva responsabilidade do responsavel legal do respectivo tributo, conforme definido na legislacao tributaria.
            </P>
            <P>
              <strong>13.7. Relacoes Trabalhistas:</strong> Sob nenhuma hipotese ou em qualquer situacao, se presumira a eventual existencia, ou se estabelecera a presuncao de qualquer vinculo empregaticio, ou obrigacoes de carater trabalhista e previdenciario entre as Partes, por si, com os prepostos ou colaboradores da outra Parte, nem qualquer das Partes sera fiadora das obrigacoes e encargos trabalhistas e sociais da outra Parte, a qual assume, neste ato, integral responsabilidade por tais obrigacoes, inclusive civil e penalmente.
            </P>
            <P>
              <strong>13.8. Anticorrupcao:</strong> As Partes deverao cumprir e garantir que todos os seus empregados, subcontratados, consultores, agentes ou representantes cumpram a Lei 12.846/13, bem como outras leis de anticorrupcao aplicaveis.
            </P>
            <P>
              <strong>13.9.</strong> Se qualquer disposicao deste Termo for considerada invalida, ilegal ou inaplicavel, isso nao afetara as demais disposicoes, que permanecerao validas, legais e aplicaveis.
            </P>
            <P>
              <strong>13.10. Comunicacoes:</strong> Na medida do possivel, todas as comunicacoes serao realizadas em meio eletronico, por meio de e-mails para o endereco de e-mail fornecido pelo Usuario no ato de cadastro na Plataforma.
            </P>
            <P>
              <strong>13.11. Foro:</strong> As Partes elegem como meio competente para qualquer acao decorrente deste Contrato, o foro da cidade de Curitiba/PR, com exclusao de qualquer outro, por mais privilegiado que seja.
            </P>
          </S>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4 mt-12">
            <p className="text-[12px] font-bold text-foreground/90 uppercase leading-[1.8]">
              O USUARIO, NESTE ATO, DECLARA E GARANTE A AILUM QUE LEU, COMPREENDEU E CONCORDA COM TODOS AS DISPOSICOES DESTE TERMO.
            </p>
          </div>

          <div className="mt-8 text-[13px] text-muted-foreground space-y-1">
            <p>Curitiba (PR), 26 de marco de 2026.</p>
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
