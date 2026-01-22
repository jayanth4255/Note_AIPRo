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
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* HERO SECTION */}
            <header className="text-center py-24 px-6 bg-gradient-to-b from-white to-gray-100">
                <h1 className="text-6xl font-extrabold text-gray-900 mb-4">
                    Note AI Pro
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                    Your intelligent workspace — write, upload, share, speak, convert, analyze,
                    and organize your notes with AI-powered precision.
                </p>

                <div className="flex justify-center gap-4">
                    <Link
                        to="/signup"
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105"
                    >
                        Get Started Free
                    </Link>
                    <Link
                        to="/login"
                        className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition border-2 border-gray-200"
                    >
                        Sign In
                    </Link>
                </div>

                {/* BACKEND STATUS */}
                <div className="mt-10 flex justify-center items-center gap-3 text-sm">
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-gray-600">{status}</span>
                        </>
                    ) : status.includes("Connected") ? (
                        <>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 font-medium">{status}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-red-700 font-medium">{status}</span>
                        </>
                    )}
                </div>
            </header>

            {/* PROFESSIONAL FEATURE SECTION */}
            <section className="py-20 px-6 max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
                    Powerful Features for Modern Productivity
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        title="Smart Writing"
                        desc="Create beautiful notes with our AI-powered editor. Get real-time suggestions and formatting help."
                        icon="✏️"
                    />

                    <FeatureCard
                        title="File Upload"
                        desc="Upload PDFs, images, and documents. AI extracts and organizes all content automatically."
                        icon="📤"
                    />

                    <FeatureCard
                        title="AI Assistant"
                        desc="Summaries, rewriting, explanations, translations — all powered by advanced AI models."
                        icon="🤖"
                    />

                    <FeatureCard
                        title="Easy Sharing"
                        desc="Share notes with your team or make them public with one click. Control access with passwords."
                        icon="🔗"
                    />

                    <FeatureCard
                        title="Text to Speech"
                        desc="Convert your notes into natural-sounding audio for easy listening on the go."
                        icon="🎧"
                    />

                    <FeatureCard
                        title="Analytics"
                        desc="Track your productivity with insights, charts, and activity timelines."
                        icon="📊"
                    />
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-6">
                    How It Works
                </h2>
                <p className="max-w-3xl mx-auto text-center text-lg text-gray-700 mb-12">
                    Note AI Pro is designed for creators, students, professionals, and teams who want
                    a faster, smarter, and cleaner way to work with information.
                </p>

                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 text-gray-800">
                    <StepCard number="1" title="Create Account" desc="Sign up in seconds and access your private workspace" />
                    <StepCard number="2" title="Start Writing" desc="Use our rich text editor or upload documents" />
                    <StepCard number="3" title="AI Tools" desc="Summarize, rewrite, explain, or translate with one click" />
                    <StepCard number="4" title="Organize & Share" desc="Tag, categorize, and share your notes securely" />
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-20 px-6 bg-blue-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        Ready to supercharge your productivity?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of users who organize their thoughts with AI
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block px-10 py-4 bg-white text-blue-600 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition transform hover:scale-105"
                    >
                        Start Free Today
                    </Link>
                </div>
            </section>

            <footer className="text-center py-8 text-gray-500 bg-gray-50">
                © {new Date().getFullYear()} Note AI Pro — All Rights Reserved.
            </footer>
        </div>
    );
}

function FeatureCard({ title, desc, icon }) {
    return (
        <div className="p-8 bg-white shadow-md rounded-2xl hover:shadow-xl transition text-center border border-gray-100">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{desc}</p>
        </div>
    );
}

function StepCard({ number, title, desc }) {
    return (
        <div className="flex gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {number}
            </div>
            <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-gray-600">{desc}</p>
            </div>
        </div>
    );
}
