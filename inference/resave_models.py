"""Re-save model without the custom optimizer so it loads anywhere."""
import keras
import tensorflow as tf
from pathlib import Path

@keras.saving.register_keras_serializable()
class WarmupCosineSchedule(keras.optimizers.schedules.LearningRateSchedule):
    def __init__(self, start_lr, peak_lr, end_lr, warmup_steps, total_steps, **kwargs):
        super().__init__(**kwargs)
        self.start_lr = start_lr
        self.peak_lr = peak_lr
        self.end_lr = end_lr
        self.warmup_steps = warmup_steps
        self.total_steps = total_steps

    def __call__(self, step):
        return self.peak_lr

    def get_config(self):
        return {"start_lr": self.start_lr, "peak_lr": self.peak_lr,
                "end_lr": self.end_lr, "warmup_steps": self.warmup_steps,
                "total_steps": self.total_steps}

d = Path(__file__).parent
print("Loading model...")
m = tf.keras.models.load_model(d / "stage_a_best.keras", compile=False)
print("Saving model...")
m.save(d / "stage_a_best.keras")
print("Done! Model re-saved without custom optimizer.")
