import AskTechnicon from '../components/AskTechnicon';

// Full-page wrapper around the exact same AskTechnicon component embedded on the Dashboard
// (Step 6.1) — no new AI logic, no new backend call, just a dedicated route to reach it directly.
export default function ChatWithAI() {
  return (
    <div>
      <h2>Chat with AI</h2>
      <p className="page-subtitle">Ask TECHNICON questions about your business data in plain language.</p>
      <AskTechnicon />
    </div>
  );
}
