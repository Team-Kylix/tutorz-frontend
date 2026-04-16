import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Code } from 'lucide-react';
import Logo from '../../components/atoms/Logo';
import Footer from '../../components/organisms/Footer';

const LandingPage = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // User Provided Palette
    const COLORS = {
        SKY_BLUE: '#4DA8DA',
        MINT_GREEN: '#80D8C3',
        SUNNY_YELLOW: '#FFD66B',
        OFF_WHITE: '#F5F5F5',
        NAVY_DARK: '#1e293b' // For high-contrast text
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;
        let animationFrameId;

        const updateCanvasSize = () => {
            if (container) {
                canvas.width = window.innerWidth;
                canvas.height = container.offsetHeight;
                init();
            }
        };

        const resizeObserver = new ResizeObserver(updateCanvasSize);
        resizeObserver.observe(container);

        let particlesArray = [];
        let mouse = {
            x: null,
            y: null,
            radius: (canvas.height / 80) * (canvas.width / 80)
        };

        const handleMouseMove = (event) => {
            // Adjust mouse Y for scrolled position within the container
            const rect = container.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
        };

        const handleMouseOut = () => {
            mouse.x = undefined;
            mouse.y = undefined;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        class Particle {
            constructor(x, y, directionX, directionY, size, color) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
                if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius + this.size) {
                    if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 10;
                    if (mouse.x > this.x && this.x > this.size * 10) this.x -= 10;
                    if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 10;
                    if (mouse.y > this.y && this.y > this.size * 10) this.y -= 10;
                }

                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            // Increase density slightly for the larger combined area
            let numberOfParticles = (canvas.height * canvas.width) / 8000;
            if (numberOfParticles > 250) numberOfParticles = 250;

            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 3) + 1.5; // Slightly larger particles
                let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * 1.5) - 0.75;
                let directionY = (Math.random() * 1.5) - 0.75;
                let color = 'rgba(128, 216, 195, 0.75)'; // More visible Mint Green dots

                particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
            }
        }

        function connect() {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                        + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 30000);
                        // More visible connections: Sky Blue lines
                        ctx.strokeStyle = `rgba(77, 168, 218, ${opacityValue * 0.4})`;
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) particlesArray[i].update();
            connect();
        }

        updateCanvasSize();
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-[#F5F5F5] text-slate-800 font-sans scroll-smooth">
            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 bg-white border-b border-slate-100 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <Logo size="small" className="!mb-0" />
                        <div className="hidden md:flex space-x-8 items-center">
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Link to="/login" className="border-2 border-[#4DA8DA] hover:bg-[#4DA8DA] hover:text-white text-[#4DA8DA] font-bold px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base transition-all">Log In</Link>
                            <Link to="/register" className="bg-gradient-to-r from-[#80D8C3] to-[#4DA8DA] hover:shadow-lg hover:shadow-[#4DA8DA]/30 text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-bold transition-all hover:scale-105">
                                Sign Up Free
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div ref={containerRef} className="relative w-full overflow-hidden snap-start">
                <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />
                
                {/* Hero Section */}
                <section id="hero-section" className="relative z-10 min-h-[90vh] flex items-center justify-center pt-24 sm:pt-20">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <div className="inline-block px-6 py-2 rounded-full bg-[#FFD66B] text-slate-900 text-sm font-extrabold mb-8 shadow-md">
                            SRI LANKA'S #1 TUITION PLATFORM
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900">
                            Unlock Your Potential with <br/> 
                            <span className="text-[#4DA8DA]">Expert Guidance</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Connect with top-tier educators, join interactive classes, and accelerate your academic journey with Tutorz.lk.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
                            <Link to="/login" className="bg-[#4DA8DA] hover:bg-[#3d8ebc] text-white px-10 py-4 rounded-full text-lg font-extrabold shadow-xl flex items-center justify-center group transition-all hover:scale-110">
                                Get Started Now
                                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Stats - Now Floating */}
                <section className="relative z-10 py-32 sm:py-20">
                    <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        <div className="p-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                            <div className="text-5xl font-black text-[#4DA8DA] mb-2">10k+</div>
                            <div className="text-slate-600 uppercase tracking-widest text-xs font-bold">Students Joined</div>
                        </div>
                        <div className="p-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                            <div className="text-5xl font-black text-[#80D8C3] mb-2">500+</div>
                            <div className="text-slate-600 uppercase tracking-widest text-xs font-bold">Expert Tutors</div>
                        </div>
                        <div className="p-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                            <div className="text-5xl font-black text-[#FFD66B] mb-2">1,200+</div>
                            <div className="text-slate-600 uppercase tracking-widest text-xs font-bold">Live Classes</div>
                        </div>
                        <div className="p-2 sm:p-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                            <div className="text-4xl sm:text-5xl font-black text-[#4DA8DA] mb-2">4.9/5</div>
                            <div className="text-slate-600 uppercase tracking-widest text-[10px] sm:text-xs font-bold">User Rating</div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="snap-start">
                <Footer />
            </div>
        </div>
    );
};

export default LandingPage;
