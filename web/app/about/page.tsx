export default function AboutPage() {
  return (
    <article className="prose dark:prose-invert max-w-2xl">
      <h1>About EcoBin</h1>
      <p>
        EcoBin is a research project on contamination-aware waste classification. It uses two image classifiers
        working in series: a Stage A model that recognises 30 different categories of household waste and maps each
        category to a disposal pathway, and a Stage B model that looks for visible contamination (food residue, grease,
        liquid) on items that would otherwise be recyclable. When Stage B detects contamination, the item is routed
        to garbage instead, because a contaminated recyclable can spoil an entire batch at the sorting plant.
      </p>

      <h2>How accurate is it?</h2>
      <p>
        The models are trained on the public Recyclable and Household Waste Classification dataset plus a synthetic
        contamination dataset generated in the project notebook. Accuracy in the lab is high, but real-world performance
        is bounded by image quality, lighting, and the angle of the photo. EcoBin should be treated as a helpful second
        opinion, not the final word. Always defer to your municipality&apos;s guidelines when in doubt.
      </p>

      <h2>Privacy</h2>
      <p>
        Photos are sent to a server for classification and then discarded. We never store images you classify unless you
        explicitly submit feedback on a prediction. The pipeline also includes a face detector that refuses to classify
        any image containing a person.
      </p>

      <h2>Feedback</h2>
      <p>
        If the model gets something wrong, tap the &ldquo;This is wrong&rdquo; button under the result and tell us the correct answer.
        Your corrections feed the next training round.
      </p>
    </article>
  );
}
