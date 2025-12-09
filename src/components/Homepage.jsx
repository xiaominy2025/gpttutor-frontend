import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QueryService from '../services/QueryService';
import { SectionFadeIn } from './SectionFadeIn';

const Homepage = () => {
	const queryService = QueryService.getInstance();
	const videoRef = useRef(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [showPlayButton, setShowPlayButton] = useState(true);

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

	// Handle video play/pause state with React state
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handlePlay = () => {
			setIsPlaying(true);
			setShowPlayButton(false);
		};

		const handlePause = () => {
			setIsPlaying(false);
			setShowPlayButton(true);
		};

		video.addEventListener('play', handlePlay);
		video.addEventListener('pause', handlePause);

		return () => {
			video.removeEventListener('play', handlePlay);
			video.removeEventListener('pause', handlePause);
		};
	}, []);


	const scrollToSection = (sectionId) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const handleVideoPlayPause = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		
		const video = videoRef.current;
		if (!video) return;

		if (video.paused) {
			// Update state immediately for better UX
			setIsPlaying(true);
			setShowPlayButton(false);
			
			// Play video directly - the promise will resolve when playing starts
			try {
				const playPromise = video.play();
				if (playPromise !== undefined) {
					await playPromise;
				}
			} catch (error) {
				// If autoplay fails, reset state
				console.warn('Video play failed:', error);
				setIsPlaying(false);
				setShowPlayButton(true);
			}
		} else {
			video.pause();
			setIsPlaying(false);
			setShowPlayButton(true);
		}
	};

	const handleVideoKeyDown = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleVideoPlayPause(e);
		}
	};

	return (
		<div className="min-h-screen bg-white overflow-x-hidden">
			<div className="max-w-6xl mx-auto">
			{/* Hero Section */}
			<section className="pt-10 pb-12 md:pt-16 md:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
				<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-end">
					{/* Left: Text Content */}
					<div>
						{/* Logo + Brand Name */}
						<div className="flex items-center gap-3 mb-6">
							<img 
								src="/assets/Engent Labs Transparent.png" 
								alt="Engent Labs Logo" 
								className="w-10 h-auto" 
							/>
							<span className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
								Engent Labs
							</span>
						</div>

						{/* Main Headline */}
						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
							<span className="hidden md:inline">AI That Helps Students Learn How to Think</span>
							<span className="md:hidden">AI That Teaches How to Think</span>
						</h1>

						{/* Subheadline */}
						<p className="text-lg md:text-xl text-gray-700 mb-6">
							A structured learning flow built from your course materials — not a generic chatbot answer.
						</p>

						{/* Tagline */}
						<p className="mt-4 text-base md:text-lg font-semibold">
							<span className="text-[#2B8AF7]">Ask Smarter.</span>{" "}
							<span className="text-gray-900">Think Deeper.</span>{" "}
							<span className="text-[#F7D500]">Apply Sharper.</span>
						</p>

						{/* CTA Buttons */}
						<div className="mt-8 flex flex-col sm:flex-row gap-4">
							<Link
								to="/labs"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#2B8AF7] text-white font-semibold shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B8AF7] focus:ring-offset-2"
							>
								Start a Practice Lab
							</Link>
							<button
								type="button"
								onClick={() => scrollToSection('example')}
								className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-gray-300 bg-white text-gray-800 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
							>
								See a Detailed Example
							</button>
						</div>
					</div>

					{/* Right: Video Content */}
					<div className="relative mt-8 md:mt-0">
						<div className="rounded-2xl shadow-xl border border-gray-200 overflow-hidden bg-black relative group aspect-video">
							<video
								ref={videoRef}
								src="/assets/Engent Labs.mp4"
								className="w-full h-full object-cover"
								muted
								loop
								playsInline
								preload="metadata"
								onClick={handleVideoPlayPause}
								aria-label="Demo video showing Engent Labs structured learning interface with strategic thinking lens, follow-up prompts, and course-aligned concepts"
								poster="/assets/decision-making-demo.png"
							/>
							
							{/* Play/Pause Button Overlay */}
							<button
								type="button"
								onClick={handleVideoPlayPause}
								onKeyDown={handleVideoKeyDown}
								onMouseDown={(e) => e.preventDefault()}
								onMouseEnter={() => !isPlaying && setShowPlayButton(true)}
								onMouseLeave={() => isPlaying && setShowPlayButton(false)}
								tabIndex={0}
								className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded-2xl z-10"
								aria-label={isPlaying ? "Pause demo video" : "Play demo video"}
							>
								<div className={`bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all ${showPlayButton ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
									{isPlaying ? (
										<svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
									) : (
										<svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
											<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
										</svg>
									)}
								</div>
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* What Is Engent Labs? */}
			<SectionFadeIn className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
						What Is Engent Labs?
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
							<div className="flex items-start gap-4 w-full">
								<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mt-1">
									<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
									</svg>
								</div>
								<p className="text-sm sm:text-base text-gray-700 leading-relaxed flex-1">
									Engent Labs is an AI-powered practice environment that teaches students structured reasoning using their actual course materials.
								</p>
							</div>
						</div>
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
							<div className="flex items-start gap-4 w-full">
								<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mt-1">
									<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<p className="text-sm sm:text-base text-gray-700 leading-relaxed flex-1">
									Instead of shortcut answers, it guides learners through a repeatable thinking flow: a strategic lens, deeper follow-up questions, and curriculum-based concepts.
								</p>
							</div>
						</div>
					</div>
				</div>
			</SectionFadeIn>

			{/* Why Engent Labs? */}
			<SectionFadeIn 
				id="why-engent"
				className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
			>
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
						Why Engent Labs?
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
						{/* Structured Learning Flow */}
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
							<div className="flex items-center gap-3 mb-3">
								<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
									<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
									</svg>
								</div>
								<h3 className="text-base sm:text-lg font-semibold text-gray-900">
									Structured Learning Flow
								</h3>
							</div>
							<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
								Every answer follows the same pattern: strategic lens, follow-up prompts, and key concepts — so students learn how to think step by step.
							</p>
						</div>

						{/* Course-Based Intelligence */}
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
							<div className="flex items-center gap-3 mb-3">
								<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
									<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
								</div>
								<h3 className="text-base sm:text-lg font-semibold text-gray-900">
									Course-Based Intelligence
								</h3>
							</div>
							<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
								Built from your syllabus, frameworks, and glossary — not from generic internet knowledge.
							</p>
						</div>

						{/* Deeper Learning, Not Shortcuts */}
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
							<div className="flex items-center gap-3 mb-3">
								<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
									<svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
									</svg>
								</div>
								<h3 className="text-base sm:text-lg font-semibold text-gray-900">
									Deeper Learning, Not Shortcuts
								</h3>
							</div>
							<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
								Students practice critical thinking and exploratory learning instead of copy-paste answers.
							</p>
						</div>

						{/* Designed for Educators */}
						<div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
							<div className="flex items-center gap-3 mb-3">
								<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
									<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
									</svg>
								</div>
								<h3 className="text-base sm:text-lg font-semibold text-gray-900">
									Designed for Educators
								</h3>
							</div>
							<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
								Transparent, predictable behavior that supports academic integrity and can be tailored to each course.
							</p>
						</div>
					</div>
				</div>
			</SectionFadeIn>

			{/* Used Around the World */}
			<SectionFadeIn className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
				<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
					<div>
						<h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
							Already Supporting Learners Across the Globe
						</h2>
						<p className="text-base md:text-lg text-gray-700 leading-relaxed">
							Engent Labs is already being used by learners across the United States, Asia, Europe, and the Middle East — even in these early stages. Our first course deployment is in the U.S., and additional courses are currently under evaluation with instructors in Asia and Europe.
						</p>
						<p className="text-base md:text-lg text-gray-700 leading-relaxed mt-4">
							The growing international interest highlights a clear need for AI that teaches students how to think.
						</p>
					</div>
					<div className="flex justify-center lg:justify-end">
						<img
							src="/assets/User by Country.png"
							alt="Map showing Engent Labs active users by country, including United States, Asia, Europe, and Middle East"
							className="rounded-2xl shadow-md border border-gray-200 max-w-md w-full"
							loading="lazy"
						/>
					</div>
				</div>
			</SectionFadeIn>

			{/* Example in Action */}
			<SectionFadeIn 
				id="example" 
				className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100"
			>
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">Example: Decision-Making Lab</h2>
					<p className="text-lg text-gray-600 text-center mb-12">See how Engent Labs turns 'answers' into structured thinking.</p>

					<div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-stretch mb-10">
						{/* Demo Image Card */}
						<div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 p-6 flex flex-col">
							<img
								src="/assets/decision-making-demo.png"
								alt="Decision-Making Lab interface showing Strategic Thinking Lens, Follow-up Prompts, and Concepts/Tools."
								className="w-full rounded-xl border border-gray-200 mb-4"
							/>
							<p className="text-sm text-gray-500 italic text-left mt-auto">
								Query: 'Under tariff uncertainty, how should I plan the production of my manufacturing plant?'
							</p>
						</div>

						{/* Three Cards */}
						<div className="flex flex-col gap-6">
							{/* Strategic Thinking Lens */}
							<div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex-1 flex flex-col" aria-label="Strategic Thinking Lens">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-semibold text-gray-900">Strategic Thinking Lens</h3>
									<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Reasoning</span>
								</div>
								<div className="space-y-2 flex-1 flex flex-col justify-center">
									<div>
										<span className="text-sm font-semibold text-blue-700">What it is: </span>
										<span className="text-sm text-gray-600">A course-aligned narrative that frames the problem using your instructor's preferred strategy.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-blue-700">Purpose: </span>
										<span className="text-sm text-gray-600">Teach students how to think, not what to copy—anchoring analysis in clear reasoning.</span>
									</div>
								</div>
							</div>

							{/* Follow-up Prompts */}
							<div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex-1 flex flex-col" aria-label="Follow-up Prompts">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-semibold text-gray-900">Follow-up Prompts</h3>
									<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Inquiry</span>
								</div>
								<div className="space-y-2 flex-1 flex flex-col justify-center">
									<div>
										<span className="text-sm font-semibold text-green-700">What it is: </span>
										<span className="text-sm text-gray-600">A set of targeted, clickable questions that extend the conversation.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-green-700">Purpose: </span>
										<span className="text-sm text-gray-600">Help students ask smarter questions and go deeper—practicing inquiry rather than shortcutting.</span>
									</div>
								</div>
							</div>

							{/* Concepts / Tools */}
							<div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex-1 flex flex-col" aria-label="Concepts and Tools">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-base font-semibold text-gray-900">Concepts / Tools</h3>
									<span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Knowledge</span>
								</div>
								<div className="space-y-2 flex-1 flex flex-col justify-center">
									<div>
										<span className="text-sm font-semibold text-purple-700">What it is: </span>
										<span className="text-sm text-gray-600">A compact list of key ideas (e.g., Scenario Planning, Aggregate Planning) linked to instructor-approved summaries.</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-purple-700">Purpose: </span>
										<span className="text-sm text-gray-600">Reinforce core concepts and vocabulary so students connect theory to practice and build durable understanding.</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</SectionFadeIn>

			{/* Final CTA */}
			<SectionFadeIn className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
				<div className="max-w-5xl mx-auto text-center">
					<h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
						Ready to Help Your Students Learn How to Think with AI?
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
						{/* Students Card */}
						<Link
							to="/labs"
							target="_blank"
							rel="noopener noreferrer"
							className="bg-white border-2 border-[#2B8AF7] text-gray-900 rounded-2xl p-6 hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 hover:-translate-y-1 cursor-pointer group shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2B8AF7] focus:ring-offset-2"
						>
							<h3 className="text-lg font-bold text-gray-900 mb-2">Students</h3>
							<p className="text-gray-700 text-sm">
								Explore a decision-making lab and experience how structured reasoning feels different from a chatbot answer.
							</p>
						</Link>

						{/* Educators Card */}
						<div className="bg-white border-2 border-[#F7D500] text-gray-900 rounded-2xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
							<h3 className="text-lg font-bold text-gray-900 mb-2">Educators</h3>
							<p className="text-gray-700 text-sm mb-3">
								Email us to discuss building a lab around your course — in weeks, not months.
							</p>
							<a 
								href="mailto:engentlabs@gmail.com" 
								className="text-[#2B8AF7] hover:text-blue-700 text-sm font-medium transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 rounded"
							>
								engentlabs@gmail.com
							</a>
						</div>
					</div>
				</div>
			</SectionFadeIn>
			</div>
		</div>
	);
};

export default Homepage;
