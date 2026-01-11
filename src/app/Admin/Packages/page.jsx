'use client';

import React, { useState, useEffect } from 'react';

const PackagesPage = () => {
  // State for packages and tests
  const [packages, setPackages] = useState([]);
  const [healthPackages, setHealthPackages] = useState([]);
  const [showAllPackages, setShowAllPackages] = useState(false);
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [isAddingHealthPackage, setIsAddingHealthPackage] = useState(false);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState(null);

  const [formData, setFormData] = useState({
    packageName: '',
    category: [], // Changed to array for multiple categories
    description: '',
    price: '',
    discount: '',
    includedTests: [],
    isPopular: false,
    overview: '',
    testPreparation: [],
    importance: [],
    youtubeLinks: [],
  });

  const [healthPackageFormData, setHealthPackageFormData] = useState({
    title: '',
    subTitle: '',
    price: '',
    discount: '',
    includedTests: [],
    packageIncludes: [],
    isMostPopular: false,
  });

  const [newPreparation, setNewPreparation] = useState('');
  const [newImportance, setNewImportance] = useState('');
  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  const [newPackageInclude, setNewPackageInclude] = useState('');

  // State for dropdown with checkboxes
  const [isTestsDropdownOpen, setIsTestsDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false); // New state for category dropdown

  // Available categories
  const categories = [
    { id: 'Men', name: 'Men' },
    { id: 'Women', name: 'Women' },
    { id: 'Kids', name: 'Kids' },
    { id: 'Elders', name: 'Elders' },
    { id: 'Couples', name: 'Couples' }
  ];

  // Fetch packages and tests from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tests
        const testsResponse = await fetch('/api/tests?showAll=true');
        const testsResult = await testsResponse.json();

        if (testsResult.success) {
          // Use tests array like in adminTestManagement page
          setAvailableTests(testsResult.tests || testsResult.data || []);
        } else {
          setError('Failed to fetch tests');
          return;
        }

        // Fetch packages
        const packagesResponse = await fetch(`/api/packages?showAll=true&_t=${Date.now()}`);
        const packagesResult = await packagesResponse.json();

        if (packagesResult.success) {
          // Ensure each package has a status field
          const packagesWithStatus = (packagesResult.data || []).map(pkg => ({
            ...pkg,
            status: pkg.status || 'Active'
          }));
          setPackages(packagesWithStatus);
        } else {
          setError('Failed to fetch packages');
        }

        // Fetch health packages
        try {
          const healthPackagesResponse = await fetch('/api/health-packages');
          const healthPackagesResult = await healthPackagesResponse.json();

          if (healthPackagesResult.success) {
            // Ensure each health package has a status field
            const healthPackagesWithStatus = (healthPackagesResult.data || []).map(pkg => ({
              ...pkg,
              status: pkg.status || 'Active'
            }));
            setHealthPackages(healthPackagesWithStatus);
          } else {
            setError('Failed to fetch health packages');
          }
        } catch (err) {
          console.error('Error fetching health packages:', err);
          setHealthPackages([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddPackage = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setCurrentStep(1);
    setIsAddingHealthPackage(false);

    setFormData({
      packageName: '',
      category: [], // Initialize as empty array
      description: '',
      price: '',
      discount: '',
      includedTests: [],
      isPopular: false,
      overview: '',
      testPreparation: [],
      importance: [],
      youtubeLinks: [],
      status: 'Active' // Add status field
    });
    setIsTestsDropdownOpen(false);
    setIsCategoryDropdownOpen(false); // Reset category dropdown state
  };

  const handleAddHealthPackage = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setCurrentStep(1);
    setIsAddingHealthPackage(true);

    setHealthPackageFormData({
      title: '',
      subTitle: '',
      price: '',
      discount: '',
      includedTests: [],
      packageIncludes: [],
      isMostPopular: false,
      status: 'Active' // Add status field
    });
    setIsTestsDropdownOpen(false);
  };

  const handleEditPackage = (pkg) => {
    setIsModalOpen(true);
    setIsEditing(true);
    setEditingPackageId(pkg._id);
    setCurrentStep(1);
    setFormData({
      packageName: pkg.packageName || '',
      category: Array.isArray(pkg.category) ? pkg.category : (pkg.category ? [pkg.category] : []), // Handle both array and string
      description: pkg.description || '',
      price: pkg.price || '',
      discount: pkg.discount || '',
      includedTests: pkg.includedTests?.map(test => test._id) || [],
      isPopular: pkg.isPopular || false,
      overview: pkg.overview || '',
      testPreparation: pkg.testPreparation || [],
      importance: pkg.importance || [],
      youtubeLinks: pkg.youtubeLinks || [],
      status: pkg.status || 'Active' // Add status field
    });
    setIsTestsDropdownOpen(false);
    setIsCategoryDropdownOpen(false); // Reset category dropdown state
  };

  const handleEditHealthPackage = async (pkg) => {
    // Fetch the full health package data for editing
    try {
      const response = await fetch(`/api/health-packages`);
      const result = await response.json();

      if (result.success) {
        const fullPackage = result.data.find(p => p._id === pkg._id);
        if (fullPackage) {
          setIsModalOpen(true);
          setIsEditing(true);
          setEditingPackageId(fullPackage._id);
          setIsAddingHealthPackage(true);
          setHealthPackageFormData({
            title: fullPackage.title || '',
            subTitle: fullPackage.subTitle || '',
            price: fullPackage.price || '',
            discount: fullPackage.discount || '',
            includedTests: fullPackage.includedTests?.map(test => test._id) || [],
            packageIncludes: fullPackage.packageIncludes || [],
            isMostPopular: fullPackage.isMostPopular || false,
            status: fullPackage.status || 'Active' // Add status field
          });
          setIsTestsDropdownOpen(false);
        }
      }
    } catch (err) {
      console.error('Error fetching health package for edit:', err);
      alert('Error fetching health package data');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setIsEditing(false);
    setEditingPackageId(null);
    setIsTestsDropdownOpen(false);
    setIsCategoryDropdownOpen(false); // Reset category dropdown state
    setIsAddingHealthPackage(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (isAddingHealthPackage) {
      setHealthPackageFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(categoryId)
        ? prev.category.filter(id => id !== categoryId)
        : [...prev.category, categoryId]
    }));
  };

  const handleTestToggle = (testId) => {
    if (isAddingHealthPackage) {
      setHealthPackageFormData(prev => ({
        ...prev,
        includedTests: prev.includedTests.includes(testId)
          ? prev.includedTests.filter(id => id !== testId)
          : [...prev.includedTests, testId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        includedTests: prev.includedTests.includes(testId)
          ? prev.includedTests.filter(id => id !== testId)
          : [...prev.includedTests, testId]
      }));
    }
  };

  const handlePackageIncludeToggle = (item) => {
    if (isAddingHealthPackage) {
      setHealthPackageFormData(prev => ({
        ...prev,
        packageIncludes: prev.packageIncludes.includes(item)
          ? prev.packageIncludes.filter(i => i !== item)
          : [...prev.packageIncludes, item]
      }));
    }
  };

  const handleAddPreparation = () => {
    if (newPreparation.trim()) {
      setFormData(prev => ({
        ...prev,
        testPreparation: [...prev.testPreparation, newPreparation]
      }));
      setNewPreparation('');
    }
  };

  const handleRemovePreparation = (index) => {
    setFormData(prev => ({
      ...prev,
      testPreparation: prev.testPreparation.filter((_, i) => i !== index)
    }));
  };

  const handleAddImportance = () => {
    if (newImportance.trim()) {
      setFormData(prev => ({
        ...prev,
        importance: [...prev.importance, newImportance]
      }));
      setNewImportance('');
    }
  };

  const handleRemoveImportance = (index) => {
    setFormData(prev => ({
      ...prev,
      importance: prev.importance.filter((_, i) => i !== index)
    }));
  };

  const handleAddYoutubeLink = () => {
    if (newYoutubeLink.trim()) {
      setFormData(prev => ({
        ...prev,
        youtubeLinks: [...prev.youtubeLinks, newYoutubeLink]
      }));
      setNewYoutubeLink('');
    }
  };

  const handleAddPackageInclude = () => {
    if (newPackageInclude.trim()) {
      setHealthPackageFormData(prev => ({
        ...prev,
        packageIncludes: [...prev.packageIncludes, newPackageInclude]
      }));
      setNewPackageInclude('');
    }
  };

  const handleRemovePackageInclude = (index) => {
    setHealthPackageFormData(prev => ({
      ...prev,
      packageIncludes: prev.packageIncludes.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveYoutubeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      youtubeLinks: prev.youtubeLinks.filter((_, i) => i !== index)
    }));
  };

  const handleToggleMostPopular = () => {
    if (isAddingHealthPackage) {
      setHealthPackageFormData(prev => ({
        ...prev,
        isMostPopular: !prev.isMostPopular
      }));
    }
  };

  const handleNextStep = () => {
    if (formData.packageName && formData.category.length > 0 && formData.description && formData.price && formData.includedTests.length > 0) {
      setCurrentStep(2);
    } else {
      alert('Please fill in all required fields and select at least one category and one test');
    }
  };

  const handleBackStep = () => {
    setCurrentStep(1);
  };

  const handleSubmitPackage = async () => {
    try {
      if (isAddingHealthPackage) {
        // Handle health package submission
        const healthPackageData = {
          title: healthPackageFormData.title,
          subTitle: healthPackageFormData.subTitle,
          price: healthPackageFormData.price,
          discount: healthPackageFormData.discount,
          includedTests: healthPackageFormData.includedTests,
          packageIncludes: healthPackageFormData.packageIncludes,
          isMostPopular: healthPackageFormData.isMostPopular,
          status: healthPackageFormData.status || 'Active' // Add status field
        };

        let result;
        if (isEditing) {
          // Update existing health package
          const response = await fetch('/api/health-packages', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              packageId: editingPackageId,
              ...healthPackageData
            }),
          });

          result = await response.json();
          if (result.success) {
            // Update health package in local state
            setHealthPackages(prev => prev.map(pkg =>
              pkg._id === editingPackageId ? { ...result.data, status: result.data.status || 'Active' } : pkg
            ));
          }
        } else {
          // Create new health package
          const response = await fetch('/api/health-packages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(healthPackageData),
          });

          result = await response.json();
          if (result.success) {
            setHealthPackages(prev => [...prev, { ...result.data, status: result.data.status || 'Active' }]);
          }
        }

        if (result.success) {
          handleCloseModal();
          alert(isEditing ? 'Health package updated successfully!' : 'Health package added successfully!');
        } else {
          alert(`Error: ${result.error}\nDetails: ${result.message || ''}\n${result.details ? JSON.stringify(result.details, null, 2) : ''}`);
        }
        return;
      }

      // Log the package data before sending
      console.log("Submitting package data:", {
        packageName: formData.packageName,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        discount: formData.discount,
        includedTests: formData.includedTests,
        isPopular: formData.isPopular,
        overview: formData.overview,
        testPreparation: formData.testPreparation,
        importance: formData.importance,
        youtubeLinks: formData.youtubeLinks,
        status: formData.status || 'Active' // Add status field
      });

      // Validate required fields before sending
      if (!formData.packageName) {
        alert("Package name is required");
        return;
      }

      if (!formData.category || formData.category.length === 0) {
        alert("At least one category must be selected");
        return;
      }

      if (!formData.description) {
        alert("Description is required");
        return;
      }

      if (!formData.price) {
        alert("Price is required");
        return;
      }

      if (!formData.includedTests || formData.includedTests.length === 0) {
        alert("At least one test must be included");
        return;
      }

      // Filter out any invalid test IDs
      const validTestIds = formData.includedTests.filter(id => {
        // Simple check to see if it looks like a valid ObjectId
        return typeof id === 'string' && id.length === 24;
      });

      if (validTestIds.length !== formData.includedTests.length) {
        console.warn("Some test IDs were invalid and filtered out");
      }

      if (validTestIds.length === 0) {
        alert("No valid tests selected");
        return;
      }

      const packageData = {
        packageName: formData.packageName,
        category: formData.category, // Now an array of categories
        description: formData.description,
        price: Number(formData.price),
        discount: formData.discount ? Number(formData.discount) : 0,
        includedTests: validTestIds,
        isPopular: Boolean(formData.isPopular),
        overview: formData.overview || '',
        testPreparation: Array.isArray(formData.testPreparation) ? formData.testPreparation : [],
        importance: Array.isArray(formData.importance) ? formData.importance : [],
        youtubeLinks: Array.isArray(formData.youtubeLinks) ? formData.youtubeLinks : [],
        status: formData.status || 'Active' // Add status field
      };

      let result;
      if (isEditing) {
        // Update existing package
        const response = await fetch('/api/packages', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageId: editingPackageId,
            ...packageData
          }),
        });

        result = await response.json();
        if (result.success) {
          // Update package in local state
          setPackages(prev => prev.map(pkg =>
            pkg._id === editingPackageId ? { ...result.data, status: result.data.status || 'Active' } : pkg
          ));
        }
      } else {
        // Create new package
        console.log("Sending package data to API:", JSON.stringify(packageData, null, 2));
        const response = await fetch('/api/packages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(packageData),
        });

        result = await response.json();
        console.log("API Response:", result);
        if (result.success) {
          setPackages(prev => [...prev, { ...result.data, status: result.data.status || 'Active' }]);
        }
      }

      if (result.success) {
        handleCloseModal();
        alert(isEditing ? 'Package updated successfully!' : 'Package added successfully!');
      } else {
        alert(`Error: ${result.error}\nDetails: ${result.message || ''}\n${result.details ? JSON.stringify(result.details, null, 2) : ''}`);
      }
    } catch (err) {
      console.error('Error saving package:', err);
      alert('Error saving package: ' + err.message);
    }
  };

  const handleView = (pkg) => {
    console.log('View package:', pkg);
    setViewingPackage(pkg);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingPackage(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        const response = await fetch(`/api/packages?packageId=${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();
        if (result.success) {
          setPackages(packages.filter(pkg => pkg._id !== id));
          alert('Package deleted successfully!');
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (err) {
        console.error('Error deleting package:', err);
        alert('Error deleting package');
      }
    }
  };

  const handleDeleteHealthPackage = async (id) => {
    if (window.confirm('Are you sure you want to delete this health package?')) {
      try {
        const response = await fetch(`/api/health-packages?packageId=${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();
        if (result.success) {
          setHealthPackages(healthPackages.filter(pkg => pkg._id !== id));
          alert('Health package deleted successfully!');
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (err) {
        console.error('Error deleting health package:', err);
        alert('Error deleting health package');
      }
    }
  };

  // Add deactivate functions
  const handleDeactivate = async (id) => {
    try {
      const packageToDeactivate = packages.find(pkg => pkg._id === id);
      if (!packageToDeactivate) return;

      const newStatus = packageToDeactivate.status === 'Active' ? 'Inactive' : 'Active';

      const response = await fetch('/api/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: id,
          status: newStatus
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPackages(packages.map(pkg =>
          pkg._id === id ? { ...pkg, status: newStatus } : pkg
        ));
        alert(`Package ${newStatus.toLowerCase()} successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating package status:', err);
      alert('Error updating package status');
    }
  };

  const handleDeactivateHealthPackage = async (id) => {
    try {
      const packageToDeactivate = healthPackages.find(pkg => pkg._id === id);
      if (!packageToDeactivate) return;

      const newStatus = packageToDeactivate.status === 'Active' ? 'Inactive' : 'Active';

      const response = await fetch('/api/health-packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: id,
          status: newStatus
        }),
      });

      const result = await response.json();
      if (result.success) {
        setHealthPackages(healthPackages.map(pkg =>
          pkg._id === id ? { ...pkg, status: newStatus } : pkg
        ));
        alert(`Health package ${newStatus.toLowerCase()} successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating health package status:', err);
      alert('Error updating health package status');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Category Packages</h1>
          <button
            onClick={handleAddPackage}
            className="bg-[#0052FF] hover:bg-[#0052FF] text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            + Add Package
          </button>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p>Loading packages and tests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Packages Management</h1>
          <button
            onClick={handleAddPackage}
            className="bg-[#0052FF] hover:bg-[#0052FF] text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            + Add Package
          </button>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Category Packages</h1>
        <button
          onClick={handleAddPackage}
          className="bg-[#0052FF] hover:bg-[#0052FF] text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          + Add Package
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                S.No
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (₹)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {packages.slice(0, showAllPackages ? packages.length : 5).map((pkg, index) => (
              <tr key={pkg._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pkg.packageName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Array.isArray(pkg.category) ? pkg.category.join(', ') : pkg.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pkg.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pkg.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {pkg.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(pkg)}
                      className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                      title="View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeactivate(pkg._id)}
                      className={`p-2 text-white rounded-md ${pkg.status === 'Active'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                        }`}
                      title={pkg.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      {pkg.status === 'Active' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {packages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No packages found. Add a new package to get started.</p>
          </div>
        )}
        {!showAllPackages && packages.length > 5 && (
          <div className="text-center py-4">
            <button
              onClick={() => setShowAllPackages(true)}
              className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200"
            >
              Show All
            </button>
          </div>
        )}
      </div>

      {/* Health Packages Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Health Packages</h2>
          <button
            onClick={handleAddHealthPackage}
            className="bg-[#0052FF] hover:bg-[#0052FF] text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            + Add Health Package
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (₹)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {healthPackages.map((pkg, index) => (
                <tr key={pkg._id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pkg.title || 'Unnamed Package'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pkg.subTitle || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{pkg.price || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pkg.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {pkg.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(pkg)}
                        className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditHealthPackage(pkg)}
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeactivateHealthPackage(pkg._id)}
                        className={`p-2 text-white rounded-md ${pkg.status === 'Active'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                          }`}
                        title={pkg.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {pkg.status === 'Active' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteHealthPackage(pkg._id)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-md"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {healthPackages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No health packages found. Add a new health package to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? (isAddingHealthPackage ? 'Edit Health Package' : 'Edit Package') : (isAddingHealthPackage ? 'Add New Health Package' : 'Add New Package')}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {isAddingHealthPackage ? (
                // Health Package Form
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Health Package Information</h3>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={healthPackageFormData.title}
                      onChange={handleInputChange}
                      placeholder="Enter package title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Sub Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub Title</label>
                    <input
                      type="text"
                      name="subTitle"
                      value={healthPackageFormData.subTitle}
                      onChange={handleInputChange}
                      placeholder="Enter sub title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Price and Discount Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        name="price"
                        value={healthPackageFormData.price}
                        onChange={handleInputChange}
                        placeholder="Enter price"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        name="discount"
                        value={healthPackageFormData.discount}
                        onChange={handleInputChange}
                        placeholder="Enter discount percentage"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Display Price with Discount */}
                  {healthPackageFormData.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#0052FF]">
                        ₹{healthPackageFormData.discount ?
                          (healthPackageFormData.price * (1 - healthPackageFormData.discount / 100)).toFixed(2) :
                          healthPackageFormData.price}
                      </span>
                      {healthPackageFormData.discount > 0 && (
                        <>
                          <span className="text-sm text-gray-500 line-through">₹{healthPackageFormData.price}</span>
                          <span className="text-sm text-green-600">{healthPackageFormData.discount}% off</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Included Tests - Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Included Tests *</label>
                    <button
                      type="button"
                      onClick={() => setIsTestsDropdownOpen(!isTestsDropdownOpen)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none text-left flex justify-between items-center"
                    >
                      <span>
                        {healthPackageFormData.includedTests.length > 0
                          ? `${healthPackageFormData.includedTests.length} test(s) selected`
                          : 'Select tests to include'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isTestsDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isTestsDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableTests.length > 0 ? (
                          availableTests.map(test => (
                            <label
                              key={test._id}
                              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={healthPackageFormData.includedTests.includes(test._id)}
                                onChange={() => handleTestToggle(test._id)}
                                className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                {test.testName} {test.organ ? `(${test.organ})` : ''}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No tests available
                          </div>
                        )}
                      </div>
                    )}

                    {healthPackageFormData.includedTests.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {healthPackageFormData.includedTests.map(testId => {
                          const test = availableTests.find(t => t._id === testId);
                          return test ? (
                            <span
                              key={testId}
                              className="inline-flex items-center px-2 py-1 bg-[#00CCFF] text-[#0052FF] text-xs rounded-full"
                            >
                              {test.testName}
                              <button
                                type="button"
                                onClick={() => handleTestToggle(testId)}
                                className="ml-1 text-[#0052FF] hover:text-[#0052FF]"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Package Includes - Dropdown with Checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Package Includes</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newPackageInclude}
                        onChange={(e) => setNewPackageInclude(e.target.value)}
                        placeholder="Enter package item"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleAddPackageInclude}
                        className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-medium"
                      >
                        + Add
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {healthPackageFormData.packageIncludes.map((item, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-700">{item}</span>
                          <button
                            onClick={() => handleRemovePackageInclude(index)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Most Popular Checkbox */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={healthPackageFormData.isMostPopular}
                        onChange={handleToggleMostPopular}
                        className="w-4 h-4 text-[#0052FF] cursor-pointer"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Mark as Most Popular</span>
                    </label>
                  </div>

                  {/* Status */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="Active"
                          checked={healthPackageFormData.status === 'Active'}
                          onChange={(e) => setHealthPackageFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-4 h-4 text-[#0052FF]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="Inactive"
                          checked={healthPackageFormData.status === 'Inactive'}
                          onChange={(e) => setHealthPackageFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-4 h-4 text-[#0052FF]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : currentStep === 1 ? (
                <div className="space-y-6">
                  {/* Step 1: Basic Info */}
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>

                  {/* Package Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                    <input
                      type="text"
                      name="packageName"
                      value={formData.packageName}
                      onChange={handleInputChange}
                      placeholder="Enter package name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Category Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none text-left flex justify-between items-center"
                    >
                      <span>
                        {formData.category.length > 0
                          ? `${formData.category.length} categor${formData.category.length > 1 ? 'ies' : 'y'} selected`
                          : 'Select categories'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {categories.map(category => (
                          <label
                            key={category.id}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.category.includes(category.id)}
                              onChange={() => handleCategoryToggle(category.id)}
                              className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {formData.category.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.category.map(categoryId => {
                          const category = categories.find(c => c.id === categoryId);
                          return category ? (
                            <span
                              key={categoryId}
                              className="inline-flex items-center px-2 py-1 bg-[#00CCFF] text-[#0052FF] text-xs rounded-full"
                            >
                              {category.name}
                              <button
                                type="button"
                                onClick={() => handleCategoryToggle(categoryId)}
                                className="ml-1 text-[#0052FF] hover:text-[#0052FF]"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter package description"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Price and Discount Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Enter price"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleInputChange}
                        placeholder="Enter discount percentage"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Included Tests - Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Include Tests *</label>
                    <button
                      type="button"
                      onClick={() => setIsTestsDropdownOpen(!isTestsDropdownOpen)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none text-left flex justify-between items-center"
                    >
                      <span>
                        {formData.includedTests.length > 0
                          ? `${formData.includedTests.length} test(s) selected`
                          : 'Select tests to include'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isTestsDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isTestsDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableTests.length > 0 ? (
                          availableTests.map(test => (
                            <label
                              key={test._id}
                              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.includedTests.includes(test._id)}
                                onChange={() => handleTestToggle(test._id)}
                                className="w-4 h-4 text-[#0052FF] border-gray-300 rounded focus:ring-[#007AFF]"
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                {test.testName} {test.organ ? `(${test.organ})` : ''}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No tests available
                          </div>
                        )}
                      </div>
                    )}

                    {formData.includedTests.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.includedTests.map(testId => {
                          const test = availableTests.find(t => t._id === testId);
                          return test ? (
                            <span
                              key={testId}
                              className="inline-flex items-center px-2 py-1 bg-[#00CCFF] text-[#0052FF] text-xs rounded-full"
                            >
                              {test.testName}
                              <button
                                type="button"
                                onClick={() => handleTestToggle(testId)}
                                className="ml-1 text-[#0052FF] hover:text-[#0052FF]"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Mark as Popular */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isPopular"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                        className="w-4 h-4 text-[#0052FF] cursor-pointer"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Mark as Popular</span>
                    </label>
                  </div>

                  {/* Status */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="Active"
                          checked={formData.status === 'Active'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-4 h-4 text-[#0052FF]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="Inactive"
                          checked={formData.status === 'Inactive'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-4 h-4 text-[#0052FF]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step 2: Additional Info */}
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h3>

                  {/* Overview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
                    <textarea
                      name="overview"
                      value={formData.overview}
                      onChange={handleInputChange}
                      placeholder="Enter package overview"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Test Preparation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Preparation Points</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newPreparation}
                        onChange={(e) => setNewPreparation(e.target.value)}
                        placeholder="Enter preparation point"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleAddPreparation}
                        className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-medium"
                      >
                        + Add
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {formData.testPreparation.map((point, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-700">{point}</span>
                          <button
                            onClick={() => handleRemovePreparation(index)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Importance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Importance Points</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newImportance}
                        onChange={(e) => setNewImportance(e.target.value)}
                        placeholder="Enter importance point"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleAddImportance}
                        className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-medium"
                      >
                        + Add
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {formData.importance.map((point, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-700">{point}</span>
                          <button
                            onClick={() => handleRemoveImportance(index)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* YouTube Links */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Links</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newYoutubeLink}
                        onChange={(e) => setNewYoutubeLink(e.target.value)}
                        placeholder="Enter YouTube URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleAddYoutubeLink}
                        className="px-4 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-medium"
                      >
                        + Add
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {formData.youtubeLinks.map((link, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 truncate">
                            {link}
                          </a>
                          <button
                            onClick={() => handleRemoveYoutubeLink(index)}
                            className="text-red-600 hover:text-red-900 font-medium ml-2"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3 sticky bottom-0 bg-white">
              <div className="flex gap-3">
                {isAddingHealthPackage ? (
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitPackage}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                    >
                      {isEditing ? 'Update Health Package' : 'Add Health Package'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    {currentStep === 2 && (
                      <button
                        onClick={handleBackStep}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                      >
                        Back
                      </button>
                    )}

                    {currentStep === 1 && (
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-2 bg-[#0052FF] text-white rounded-lg hover:bg-[#0052FF] transition-colors duration-200 font-medium"
                      >
                        Next
                      </button>
                    )}

                    {currentStep === 2 && (
                      <button
                        onClick={handleSubmitPackage}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                      >
                        {isEditing ? 'Update Package' : 'Add Package'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Package Modal */}
      {isViewModalOpen && viewingPackage && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {viewingPackage.title ? 'Health Package Details' : 'Package Details'}
              </h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Name/Title</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewingPackage.title || viewingPackage.packageName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(viewingPackage.status || 'Active') === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {viewingPackage.status || 'Active'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
                  <p className="text-lg text-gray-900 flex items-center gap-2">
                    ₹{viewingPackage.price}
                    {viewingPackage.discount > 0 && (
                      <span className="text-sm text-green-600 font-medium">
                        ({viewingPackage.discount}% off)
                      </span>
                    )}
                  </p>
                </div>

                {viewingPackage.subTitle && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Subtitle</label>
                    <p className="text-base text-gray-900">{viewingPackage.subTitle}</p>
                  </div>
                )}

                {!viewingPackage.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                    <p className="text-base text-gray-900">
                      {Array.isArray(viewingPackage.category)
                        ? viewingPackage.category.join(', ')
                        : viewingPackage.category}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {(viewingPackage.description || viewingPackage.overview) && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {viewingPackage.description ? 'Description' : 'Overview'}
                  </label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {viewingPackage.description || viewingPackage.overview}
                  </p>
                </div>
              )}

              {/* Included Tests */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Included Tests</label>
                <div className="flex flex-wrap gap-2">
                  {viewingPackage.includedTests && viewingPackage.includedTests.length > 0 ? (
                    viewingPackage.includedTests.map((test, index) => {
                      // Handle both populated objects and ID strings
                      let testName = 'Unknown Test';
                      if (typeof test === 'object' && test !== null) {
                        testName = test.testName || 'Unknown Test';
                        if (test.organ) testName += ` (${test.organ})`;
                      } else {
                        const foundTest = availableTests.find(t => t._id === test);
                        if (foundTest) {
                          testName = foundTest.testName;
                          if (foundTest.organ) testName += ` (${foundTest.organ})`;
                        }
                      }

                      return (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {testName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 italic">No tests included</span>
                  )}
                </div>
              </div>

              {/* Health Package Includes List */}
              {viewingPackage.packageIncludes && viewingPackage.packageIncludes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Package Includes</label>
                  <ul className="list-disc pl-5 space-y-1 text-gray-900">
                    {viewingPackage.packageIncludes.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regular Package Prep/Importance */}
              {!viewingPackage.title && (
                <>
                  {viewingPackage.testPreparation && viewingPackage.testPreparation.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Preparation</label>
                      <ul className="list-disc pl-5 space-y-1 text-gray-900">
                        {viewingPackage.testPreparation.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingPackage.importance && viewingPackage.importance.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Importance</label>
                      <ul className="list-disc pl-5 space-y-1 text-gray-900">
                        {viewingPackage.importance.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingPackage.youtubeLinks && viewingPackage.youtubeLinks.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Videos</label>
                      <ul className="space-y-1">
                        {viewingPackage.youtubeLinks.map((link, idx) => (
                          <li key={idx}>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 sticky bottom-0">
              <button
                onClick={closeViewModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PackagesPage;