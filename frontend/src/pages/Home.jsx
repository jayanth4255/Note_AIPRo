import { Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import api from "../api"; // adjust path if needed

export default function Home() {
    const [status, setStatus] = useState("Checking backend...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/health")
            .then((res) => {
                setStatus("Backend Connected: " + res.data.app_name);
            })
            .catch(() => {
                setStatus("Backend Not Connected");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* HERO SECTION */}
            <header className="text-center py-20 px-6 bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
                        Latest: AI-Powered Notes v2.0
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                        Your intelligent workspace for <span className="text-primary-600">better ideas</span>.
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Write, upload, analyze, and organize your notes with AI precision. The clutter-free workspace for modern professionals.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/signup"
                            className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-lg font-semibold shadow-sm hover:shadow transition-all"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg text-lg font-medium border border-gray-300 shadow-sm transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* BACKEND STATUS */}
                    <div className="mt-12 flex justify-center items-center gap-2 text-sm text-gray-500">
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                                <span>Checking status...</span>
                            </>
                        ) : status.includes("Connected") ? (
                            <>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-gray-600">{status}</span>
                            </>
                        ) : (
                            <>
                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                <span className="text-gray-600">{status}</span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* FEATURES GRID */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Everything you need to be productive
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Powerful features wrapped in a simple, distraction-free interface.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            title="Smart Editor"
                            desc="Distraction-free writing with AI-powered suggestions and formatting."
                            icon="✨"
                        />
                        <FeatureCard
                            title="File Analysis"
                            desc="Upload PDFs and images. Let AI extract text and insights instantly."
                            icon="📄"
                        />
                        <FeatureCard
                            title="AI Assistant"
                            desc="Summarize, rewrite, and translate your notes with one click."
                            icon="🤖"
                        />
                        <FeatureCard
                            title="Secure Sharing"
                            desc="Share specific notes with password protection and expiration dates."
                            icon="🔒"
                        />
                        <FeatureCard
                            title="Audio Notes"
                            desc="Convert your written notes into natural-sounding audio."
                            icon="🎧"
                        />
                        <FeatureCard
                            title="Deep Analytics"
                            desc="Visualize your productivity habits and note-taking trends."
                            icon="📊"
                        />
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 px-6 bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Ready to simplify your workflow?
                    </h2>
                    <p className="text-xl text-gray-600 mb-10">
                        Join thousands of professionals organizing their thoughts with NoteAI Pro.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-lg font-semibold transition-colors"
                    >
                        Start Your Free Trial
                    </Link>
                </div>
            </section>

            <footer className="py-8 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
                <p>© {new Date().getFullYear()} Note AI Pro. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ title, desc, icon }) {
    return (
        <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{desc}</p>
        </div>
    );
}
