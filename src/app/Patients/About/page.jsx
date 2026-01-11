import React from 'react'
import { Shield, Users, Award, Clock } from 'lucide-react'

const About = () => {
  const features = [
    {
      icon: <Shield className="h-10 w-10 text-[#007AFF]" />,
      title: "Certified Lab",
      description: "NABL accredited laboratory ensuring highest quality standards and accurate results for all diagnostic tests."
    },
    {
      icon: <Users className="h-10 w-10 text-[#007AFF]" />,
      title: "Expert Team",
      description: "Experienced pathologists and technicians with years of expertise in diagnostic medicine and patient care."
    },
    {
      icon: <Award className="h-10 w-10 text-[#007AFF]" />,
      title: "Quality Assurance",
      description: "State-of-the-art equipment and stringent quality control measures ensure reliable and precise test results."
    },
    {
      icon: <Clock className="h-10 w-10 text-[#007AFF]" />,
      title: "Quick Results",
      description: "Fast turnaround times with most test results available within 24 hours, ensuring timely medical decisions."
    }
  ]

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-[#00CCFF] via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Accent Bar */}
          <div className="relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-[#007AFF] to-[#00A3FF] rounded-full"></div>
            <div className="pl-8">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                Why Choose <span className="text-[#007AFF]">RightsLab</span>?
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                With over 15 years of experience in diagnostic services, RightsLab has been a trusted name in healthcare. We combine cutting-edge technology with compassionate care to deliver accurate results that help you make informed health decisions.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-white rounded-xl shadow hover:shadow-lg transition-all border border-[#00CCFF]">
                  <div className="text-3xl font-bold text-[#0052FF] mb-1">50,000+</div>
                  <div className="text-gray-500 text-sm">Tests Conducted</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow hover:shadow-lg transition-all border border-[#00CCFF]">
                  <div className="text-3xl font-bold text-[#0052FF] mb-1">99.5%</div>
                  <div className="text-gray-500 text-sm">Accuracy Rate</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow hover:shadow-lg transition-all border border-[#00CCFF]">
                  <div className="text-3xl font-bold text-[#0052FF] mb-1">24/7</div>
                  <div className="text-gray-500 text-sm">Support Available</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow hover:shadow-lg transition-all border border-[#00CCFF]">
                  <div className="text-3xl font-bold text-[#0052FF] mb-1">15+</div>
                  <div className="text-gray-500 text-sm">Years Experience</div>
                </div>
              </div>
              <button className="bg-gradient-to-r from-[#007AFF] to-[#0052FF] text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:from-[#0052FF] hover:to-[#0000FF] transition-all duration-300 transform hover:scale-105">
                Learn More About Us
              </button>
            </div>
          </div>
          {/* Features Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg border border-[#00CCFF] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About