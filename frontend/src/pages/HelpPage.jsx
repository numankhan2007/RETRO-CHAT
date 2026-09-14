import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8 pb-12">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Help & Support</h1>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-accent-900/20 text-accent-900 flex items-center justify-center rounded-full mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
          </div>
          <h2 className="font-display font-bold text-xl text-ink">Need Assistance?</h2>
          <p className="font-mono text-xs text-center text-ink-muted mt-2 max-w-[250px]">
            Whether you found a bug or just need a hand, we're here to help you out.
          </p>
        </div>

        <a href="mailto:support@retrochat.com" className="block w-full mb-6">
          <Button className="w-full">Contact Support</Button>
        </a>

        <div className="border-t-2 border-dashed border-accent-900/20 pt-4 mt-2">
          <h3 className="font-display font-bold text-lg mb-3">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm font-mono text-ink">Why can't I see usernames?</h4>
              <p className="text-xs font-mono text-ink-muted mt-1 leading-relaxed">
                Usernames are hidden on purpose to prevent algorithmic profiling and stalking. Once you become friends with someone, their username will be revealed to you.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm font-mono text-ink">How do I change my theme?</h4>
              <p className="text-xs font-mono text-ink-muted mt-1 leading-relaxed">
                Go back to Settings and click on "Appearance". You can select different themes or toggle between Light and Dark mode.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm font-mono text-ink">Are my messages secure?</h4>
              <p className="text-xs font-mono text-ink-muted mt-1 leading-relaxed">
                Messages are transmitted securely over WebSockets and stored in our database. Only you and your friend can read your private messages.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
