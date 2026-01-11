'use client'

import React from 'react'
import Navbar from '../Patients/page'
import Footer from '../Patients/Footer/page'

export default function CursorTestPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Cursor Test Page</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Test Elements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Field Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Input Field:</label>
                  <input 
                    type="text" 
                    placeholder="This should have IBeam cursor" 
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                
                {/* Textarea Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Textarea:</label>
                  <textarea 
                    placeholder="This should also have IBeam cursor" 
                    className="w-full px-3 py-2 border rounded"
                    rows="3"
                  ></textarea>
                </div>
                
                {/* Button Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Button:</label>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    This should have hand cursor
                  </button>
                </div>
                
                {/* Link Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Link:</label>
                  <a href="#" className="text-blue-500 hover:underline">
                    This should also have hand cursor
                  </a>
                </div>
                
                {/* Select Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Select Dropdown:</label>
                  <select className="w-full px-3 py-2 border rounded">
                    <option>This should have IBeam cursor</option>
                    <option>Option 1</option>
                    <option>Option 2</option>
                  </select>
                </div>
                
                {/* Disabled Button Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Disabled Button:</label>
                  <button 
                    disabled 
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                  >
                    This should have not-allowed cursor
                  </button>
                </div>
                
                {/* Radio Buttons Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Radio Buttons:</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="radio1" 
                        name="radio-group" 
                        className="cursor-default mr-2"
                      />
                      <label htmlFor="radio1" className="cursor-default">Option 1 (default cursor)</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="radio2" 
                        name="radio-group" 
                        className="cursor-default mr-2"
                      />
                      <label htmlFor="radio2" className="cursor-default">Option 2 (default cursor)</label>
                    </div>
                  </div>
                </div>
                
                {/* Checkboxes Test */}
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Checkboxes:</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="checkbox1" 
                        className="cursor-default mr-2"
                      />
                      <label htmlFor="checkbox1" className="cursor-default">Checkbox 1 (default cursor)</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="checkbox2" 
                        className="cursor-default mr-2"
                      />
                      <label htmlFor="checkbox2" className="cursor-default">Checkbox 2 (default cursor)</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
              <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                <li>Hover over the input field - cursor should be IBeam (text cursor)</li>
                <li>Hover over the textarea - cursor should be IBeam (text cursor)</li>
                <li>Hover over the select dropdown - cursor should be IBeam (text cursor)</li>
                <li>Hover over the button - cursor should be hand (pointer cursor)</li>
                <li>Hover over the link - cursor should be hand (pointer cursor)</li>
                <li>Hover over the disabled button - cursor should be not-allowed</li>
                <li>Hover over radio buttons - cursor should be default</li>
                <li>Hover over checkboxes - cursor should be default</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Tailwind CSS Utility Tests:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="p-3 border rounded">
                  <p className="mb-2">Element with <code className="bg-gray-100 px-1 rounded">cursor-pointer</code>:</p>
                  <div className="cursor-pointer p-2 bg-white border rounded text-center">
                    Hover over me - should be hand cursor
                  </div>
                </div>
                
                <div className="p-3 border rounded">
                  <p className="mb-2">Element with <code className="bg-gray-100 px-1 rounded">cursor-text</code>:</p>
                  <div className="cursor-text p-2 bg-white border rounded">
                    Hover over me - should be IBeam cursor
                  </div>
                </div>
                
                <div className="p-3 border rounded">
                  <p className="mb-2">Element with <code className="bg-gray-100 px-1 rounded">cursor-not-allowed</code>:</p>
                  <div className="cursor-not-allowed p-2 bg-white border rounded text-center">
                    Hover over me - should be not-allowed cursor
                  </div>
                </div>
                
                <div className="p-3 border rounded">
                  <p className="mb-2">Element with <code className="bg-gray-100 px-1 rounded">cursor-help</code>:</p>
                  <div className="cursor-help p-2 bg-white border rounded text-center">
                    Hover over me - should be help cursor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}