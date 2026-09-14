import { useNavigate } from "react-router-dom";
import Card from "../components/Card";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md md:max-w-3xl mx-auto flex flex-col gap-4 mt-8 pb-12">
      <div className="flex items-center mb-2 border-b-2 border-accent-900 pb-2">
        <button onClick={() => navigate("/settings")} className="p-2 -ml-2 mr-2 hover:bg-accent-900/10 rounded-full text-accent-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-display font-bold text-2xl flex-1 text-center pr-8">Terms & Policy</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4 font-mono text-xs text-ink leading-relaxed h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          <h3 className="font-bold text-sm">1. Terms of Service</h3>
          <p>
            By accessing and using Retro Chat, you accept and agree to be bound by the terms and provision of this agreement. 
          </p>
          <p>
            You agree to use this application for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of Retro Chat.
          </p>
          
          <h3 className="font-bold text-sm mt-4">2. Privacy Policy</h3>
          <p>
            We take your privacy seriously. Retro Chat collects minimal personal data necessary to provide its services (such as your email address for authentication).
          </p>
          <p>
            Your usernames remain hidden until friend requests are mutually accepted. We do not sell your personal data to third parties, nor do we run algorithmic ranking models on your behavior.
          </p>
          
          <h3 className="font-bold text-sm mt-4">3. Data Retention and Deletion</h3>
          <p>
            You have the right to delete your account at any time from the Settings menu. Upon deletion, your posts, messages, and profile information will be permanently removed from our active database.
          </p>
          <p>
            Residual copies may remain in secure, encrypted backups for a limited period of time before being automatically overwritten.
          </p>

          <h3 className="font-bold text-sm mt-4">4. Code of Conduct</h3>
          <p>
            We enforce a zero-tolerance policy for harassment, hate speech, spamming, and illegal content. Users found violating these rules will face immediate and permanent account suspension.
          </p>
          
          <h3 className="font-bold text-sm mt-4">5. Disclaimer of Warranties</h3>
          <p>
            This service is provided "as is" and "as available" without any warranties of any kind, whether express or implied.
          </p>
        </div>
      </Card>
    </div>
  );
}
