export function ChatWelcome() {
  return (
    <section
      className="mb-[36px] text-center max-[600px]:mb-[28px]"
      aria-labelledby="welcome-title"
    >
      <h1
        className="
      mb-[14px] 
      text-[clamp(32px,5vw,46px)] 
      leading-[1.15] font-[550] 
      tracking-[-1.8px] 
      text-strong max-[600px]:tracking-[-1.2px]
      "
        id="welcome-title"
      >
        What{`'`}s on your mind?
      </h1>
    </section>
  );
}
