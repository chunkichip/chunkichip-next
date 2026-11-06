import styles from './CookieSpinner.module.css';

export default function CookieSpinner({ size = 32 }: { size?: number }) {
  return (
    <span role="status" aria-label="Loading" className={styles.spinner} style={{ width: size, height: size }}>
      <img src="/spinner-red.png" alt="" className={styles.icon} width={size} height={size}/>
      <img src="/spinner-pink.png" alt="" className={styles.pink} width={size} height={size}/>
    </span>
  );
}
