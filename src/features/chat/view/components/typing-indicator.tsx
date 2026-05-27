import styles from "./typing-indicator.module.css";

export const TypingIndicator = () => (
  <span className={styles.wave} role="status" aria-label="A IA está digitando">
    <span className={styles.dot} />
    <span className={styles.dot} />
    <span className={styles.dot} />
  </span>
);
