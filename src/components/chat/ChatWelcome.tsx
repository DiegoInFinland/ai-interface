// Empty-state heading shown by App.tsx when there are no conversation messages.
// aria-labelledby connects the section to its heading for assistive technology.
export function ChatWelcome() {
  return (
    <section className="chat-welcome" aria-labelledby="welcome-title">
      <h1 id="welcome-title">What’s on your mind?</h1>
      <p>A question, a rough idea, a fresh start. Bring it here.</p>
    </section>
  );
}
