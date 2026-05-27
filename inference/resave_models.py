"""Re-save models without the custom optimizer so they load anywhere."""
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
print("Loading Stage A...")
a = tf.keras.models.load_model(d / "stage_a_best.keras", compile=False)
print("Saving Stage A...")
a.save(d / "stage_a_best.keras")

print("Loading Stage B...")
b = tf.keras.models.load_model(d / "stage_b_best.keras", compile=False)
print("Saving Stage B...")
b.save(d / "stage_b_best.keras")

print("Done! Models re-saved without custom optimizer.")
