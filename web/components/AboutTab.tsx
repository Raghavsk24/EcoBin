export default function AboutTab() {
  return (
    <div className="p-8" style={{ lineHeight: '1.9', fontSize: '0.875rem' }}>
      <p className="mb-5">
        Hi, my name is{' '}
        <a
          href="https://www.linkedin.com/in/raghav-senthil-kumar/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Raghav Senthil Kumar
        </a>
        ! I created EcoBin to help better educate people about recycling and waste disposal habits. In the United
        States over <strong>292 million tons of waste are generated each year</strong> and that
        number is expected to double by 2050. Yet{' '}
        <a
          href="https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/frequent-questions-regarding-epas-facts-and"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          less than a third of our waste stream
        </a>{' '}
        is actually recycled. This is because nearly{' '}
        <strong>three-fourths of recyclable items are lost at the household level</strong>.
      </p>

      <p className="mb-5">
        The first is a free AI tool accessible in the "Scan Waste Item"
        tab. Upload a photo of the waste item you want to dispose of and EcoBin runs a two-stage neural network that identifies what the
        object is, assesses its condition, and then explains how to dispose of the item.
      </p>

      <p className="mb-5">
        The "Quiz Yourself" tab presents an educational resource that allows you to test your recycling knowledge and learn. We have over 100
        flashcards in our database. You can randomly quiz yourself on up to 10 of those
        flashcards at a time and try to guess how the waste item should be disposed of. After
        every question, you are given an explanation as to why you
        were either right or wrong and a summary of you results (kinda like Quizlet). You can take up to 10 different quizzes!
      </p>

      <p className="mb-5">
        EcoBin is a research project, not a certified recycling authority. While Stage A achieves a pathway-level accuracy of 96.3% on its test set, that number was measured on studio-like photos from its training dataset, not on arbitrary phone or laptop camera photos from users like you. If EcoBin gives you a result that doesn't seem right, trust your instincts and check your local recycling guidelines. When in doubt, throw it out.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
        <p>
          <strong>GitHub:</strong>{' '}
          <a
            href="https://github.com/Raghavsk24/EcoBin"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            https://github.com/Raghavsk24/EcoBin
          </a>
        </p>
        <p>
          <strong>Kaggle:</strong>{' '}
          <a
            href="https://www.kaggle.com/code/ragbag84/ecobin-two-stage-waste-classification-pipeline"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            https://www.kaggle.com/code/ragbag84/ecobin-two-stage-waste-classification-pipeline
          </a>
        </p>
        <p>
          <strong>Medium Blog:</strong>{' '}
          <a
            href="https://medium.com/@senthilkumaraghav/week-1-of-13-ecobin-a-web-application-for-waste-classification-96dc9b105aac"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            https://medium.com/@senthilkumaraghav/week-1-of-13-ecobin-a-web-application-for-waste-classification-96dc9b105aac
          </a>
        </p>
      </div>
    </div>
  );
}
