/**
 * Edite perguntas e respostas aqui.
 * `correct` é o índice (0-based) da opção correta em `options`.
 * `success` (opcional) é a mensagem especial ao acertar.
 * `successImage` (opcional) é o arquivo da foto que aparece ao acertar.
 */
const QUIZ_CONFIG = {
  intro: {
    title: "Antes de desbloquear sua surpresa... ❤️",
    subtitle: "Quero saber se você lembra da nossa história.",
  },
  questions: [
    {
      text: "Onde nos conhecemos?",
      options: ["Na academia", "Pelo Instagram", "Por amigos em comum", "No trabalho"],
      correct: 0,
    },
    {
      text: "Como foi nosso primeiro encontro?",
      options: ["Show Jads e Jadson", "Cinema", "Passeio no parque", "Jantar romântico"],
      correct: 0,
    },
    {
      text: "Onde foi nosso primeiro beijo?",
      options: ["Na academia", "No show do Jads e Jadson", "Na escola", "Na praça"],
      correct: 0,
      success: "No corredor dos banheiros, lembra? Nos abraçamos e demos um celinho ❤️",
    },
    {
      text: "Qual foi nossa primeira foto juntos?",
      options: ["Selfie no Parque das Nações Indígenas", "Foto de viagem", "Foto de festa", "Foto no espelho"],
      correct: 0,
      success: "Lembra do nosso encontro? Essa foi a nossa primeira foto juntos ❤️",
      successImage: "primeira-foto.png",
    },
  ],
};
