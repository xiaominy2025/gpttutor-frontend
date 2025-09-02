import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import QueryService from '../services/QueryService';
// Icons removed per request to eliminate large symbols from the homepage

const Homepage = () => {
	const queryService = QueryService.getInstance();

	// Pre-warm Lambda when homepage loads
	useEffect(() => {
		const preWarmLambda = async () => {
			console.log('🚀 Homepage: Starting pre-warm-up of Lambda function...');
			try {
				// Start warm-up in background (don't await - let it run while user browses)
				// Use the existing warm-up mechanism
				if (!queryService.isWarmedUp) {
					console.log('🔥 Homepage: Lambda not warmed up, starting warm-up process...');
					// This will trigger the warm-up in the background
					queryService.query("What is strategic planning?", "decision").then(() => {
						console.log('✅ Homepage: Lambda pre-warm-up completed successfully');
					}).catch((error) => {
						console.warn('⚠️ Homepage: Lambda pre-warm-up failed:', error);
					});
				} else {
					console.log('✅ Homepage: Lambda already warmed up, no pre-warming needed');
				}
			} catch (error) {
				console.warn('⚠️ Homepage: Failed to start Lambda pre-warm-up:', error);
			}
		};

		// Start pre-warming immediately when homepage loads
		preWarmLambda();
	}, []);

	const scrollToSection = (sectionId) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<div className="min-h-screen bg-white max-w-6xl mx-auto overflow-x-hidden">
							{/* Hero Section */}
				<section className="py-3 flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 px-4 sm:px-6 lg:px-8">
				<div className="max-w-5xl mx-auto text-center">
					{/* Logo and Title on same line */}
					<div className="flex items-center justify-center gap-4 mb-6 mt-8">
						<img
							src="/assets/Engent Labs Transparent.png"
							alt="Engent Labs Logo"
							className="w-16 h-auto"
						/>
						<h1 className="text-3xl font-extrabold text-gray-800">
							A GPT-powered active learning platform.
						</h1>
					</div>

					{/* Sub-line */}
					<p className="text-xl mb-6 font-bold">
						<span className="text-blue-600">Ask Smarter.</span>{" "}
						<span className="text-gray-800">Think Deeper.</span>{" "}
						<span className="text-yellow-600">Apply Sharper.</span>
					</p>
				</div>
			</section>

			{/* Action Buttons */}
			<section className="bg-white">
				<div className="w-full">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-0 w-full">
						{/* Left Button - Explore Practice Labs */}
						<Link
							to="/labs"
							target="_blank"
							rel="noopener noreferrer"
							className="bg-blue-600 text-white p-4 hover:bg-blue-700 transition-colors duration-200 cursor-pointer text-center border-r border-white"
						>
							<h3 className="text-lg font-bold">
								Explore Practice Labs
							</h3>
						</Link>
						
						{/* Right Button - Example in Action */}
						<button
							onClick={() => scrollToSection('example')}
							className="bg-yellow-500 text-white p-4 hover:bg-yellow-600 transition-colors duration-200 cursor-pointer text-center rounded-none"
						>
							<h3 className="text-lg font-bold">
								Example in Action
							</h3>
						</button>
					</div>
				</div>
			</section>

			{/* Mission & Vision */}
			<section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Mission & Vision</h2>
					<div className="grid md:grid-cols-2 gap-8">
						{/* Mission */}
						<div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-xl font-bold text-blue-700 mb-4">Our Mission</h3>
							<p className="text-base text-gray-700 leading-relaxed">
								To empower students and educators with an AI learning companion that supports real understanding and helps prevent misuse of AI for academic dishonesty.
							</p>
						</div>

						{/* Vision */}
						<div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-xl font-bold text-blue-700 mb-4">Our Vision</h3>
							<p className="text-base text-gray-700 leading-relaxed">
								In a world where AI is often misused as a shortcut, Engent Labs stands apart as a structured thinking partner. We guide students through reasoning processes that mirror how real decisions are made — transparent, course-aligned, and deeply connected to practice.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{/* Concept Summary */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Concept Summary</h3>
							<p className="text-sm text-gray-600">A clear explanation of the core concept involved.</p>
						</div>

						{/* Strategy / Framework */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Strategy / Framework</h3>
							<p className="text-sm text-gray-600">How the concept is typically applied or analyzed.</p>
						</div>

						{/* Real-World Example */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Real-World Example</h3>
							<p className="text-sm text-gray-600">An applied case to ground understanding.</p>
						</div>

						{/* Reflective Questions */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Reflective Questions</h3>
							<p className="text-sm text-gray-600">Prompts for the student to reason through their case.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Differentiators */}
			<section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Why Engent Labs?</h2>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{/* Real Understanding */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Real Understanding</h3>
							<p className="text-sm text-gray-600">Not shortcuts, but structured thinking that builds lasting knowledge.</p>
						</div>

						{/* Course-Aligned by Design */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Course-Aligned by Design</h3>
							<p className="text-sm text-gray-600">Tutors are built using instructor priorities, frameworks, tone, and examples.</p>
						</div>

						{/* Teacher Empowerment */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Teacher Empowerment</h3>
							<p className="text-sm text-gray-600">Tools that enhance your teaching, not replace it.</p>
						</div>

						{/* Transparent & Ethical */}
						<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Transparent & Ethical</h3>
							<p className="text-sm text-gray-600">Clear reasoning processes that promote responsible AI use.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Who It's For */}
			<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Who It's For</h2>
					<div className="grid md:grid-cols-2 gap-8">
						{/* Students */}
						<div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100">
							<div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-700" />
							<div className="p-6">
								<h3 className="text-base font-bold text-gray-900 mb-3">Students</h3>
								<p className="text-sm text-gray-700 leading-relaxed">
									Learn the why, not just the what. Practice structured thinking that prepares you for real-world complexity.
								</p>
							</div>
						</div>

						{/* Educators */}
						<div id="educators" className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100">
							<div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-700" />
							<div className="p-6">
								<h3 className="text-base font-bold text-gray-900 mb-3">Educators</h3>
								<p className="text-sm text-gray-700 leading-relaxed">
									A trusted AI that reinforces your course materials. Customize Labs in under an hour. Help students use AI thoughtfully and responsibly.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Example in Action */}
			<section id="example" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Example in Action: Decision-Making Lab</h2>
					<p className="text-lg text-gray-600 text-center mb-12">See how Engent Labs turns 'answers' into structured thinking.</p>

					<div className="grid lg:grid-cols-2 gap-10 items-start mb-10">
						{/* Demo Image */}
						<div className="flex flex-col items-center lg:items-start">
							<img
								src="/assets/decision-making-demo.png"
								alt="Decision-Making Lab interface showing Strategic Thinking Lens, Follow-up Prompts, and Concepts/Tools."
								className="max-w-lg rounded-xl shadow-lg border border-gray-200"
							/>
							<p className="text-sm text-gray-500 mt-3 italic text-center lg:text-left">
								Query: 'Under tariff uncertainty, how should I plan the production of my manufacturing plant?'
							</p>
						</div>

						{/* Three Cards */}
						<div className="space-y-6">
							{/* Strategic Thinking Lens */}
							<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100" aria-label="Strategic Thinking Lens">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-semibold text-gray-900">Strategic Thinking Lens</h3>
									<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Reasoning</span>
								</div>
								<div className="space-y-2">
									<div>
										<span className="text-sm font-semibold text-blue-700">What it is: </span>
										<span className="text-sm text-gray-600">A concise, course-aligned narrative that frames the problem using the instructor's preferred strategy or model.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-blue-700">Purpose: </span>
										<span className="text-sm text-gray-600">Teach students how to think, not what to copy—anchoring analysis in clear reasoning aligned with class frameworks.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-blue-700">Function: </span>
										<span className="text-sm text-gray-600">Renders a structured explanation generated from course metadata and templates so students can follow a repeatable thinking pattern.</span>
									</div>
								</div>
							</div>

							{/* Follow-up Prompts */}
							<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100" aria-label="Follow-up Prompts">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-semibold text-gray-900">Follow-up Prompts</h3>
									<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Inquiry</span>
								</div>
								<div className="space-y-2">
									<div>
										<span className="text-sm font-semibold text-green-700">What it is: </span>
										<span className="text-sm text-gray-600">A set of targeted, clickable questions that extend the conversation.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-green-700">Purpose: </span>
										<span className="text-sm text-gray-600">Help students ask smarter questions and go deeper—practicing inquiry rather than shortcutting.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-green-700">Function: </span>
										<span className="text-sm text-gray-600">Each prompt is a button; clicking auto-fills the input and submits a new query, guiding iterative learning.</span>
									</div>
								</div>
							</div>

							{/* Concepts / Tools */}
							<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100" aria-label="Concepts and Tools">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-semibold text-gray-900">Concepts / Tools</h3>
									<span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Knowledge</span>
								</div>
								<div className="space-y-2">
									<div>
										<span className="text-sm font-semibold text-purple-700">What it is: </span>
										<span className="text-sm text-gray-600">A compact list of key ideas (e.g., Scenario Planning, Aggregate Planning) linked to instructor-approved summaries.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-purple-700">Purpose: </span>
										<span className="text-sm text-gray-600">Reinforce core concepts and vocabulary so students connect theory to practice and build durable understanding.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-purple-700">Function: </span>
										<span className="text-sm text-gray-600">Each concept shows a short definition; optionally expand to see examples, tooltips, or course notes.</span>
									</div>
								</div>
							</div>
						</div>
					</div>


				</div>
			</section>

							{/* Call to Action */}
				<section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500">
				<div className="max-w-5xl mx-auto text-center">
					<h2 className="text-2xl font-bold text-gray-800 mb-8">Ready to Transform Learning?</h2>

					<div className="grid md:grid-cols-2 gap-6 text-left">
						<Link
							to="/labs"
							target="_blank"
							rel="noopener noreferrer"
							className="bg-blue-600 text-white rounded-2xl p-6 hover:bg-blue-700 transition-all duration-200 cursor-pointer group shadow-lg"
						>
							<h3 className="text-base font-bold text-white mb-2">Students</h3>
							<p className="text-blue-100 text-sm">
								Ask better questions. Get better answers. Learn for real.
							</p>
						</Link>
						<div className="bg-yellow-500 text-white rounded-2xl p-6 shadow-lg">
							<h3 className="text-base font-bold text-white mb-2">Educators</h3>
							<p className="text-yellow-100 text-sm">
								Contact us to build your own practice lab.
							</p>
							<a 
								href="mailto:engentlabs@gmail.com" 
								className="text-white hover:text-yellow-200 text-sm font-medium transition-colors duration-200"
							>
								engentlabs@gmail.com
							</a>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Homepage;
