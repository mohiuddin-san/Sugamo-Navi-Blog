import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for tourist places
const supabaseTouristUrl = import.meta.env.VITE_TOURIST_SUPABASE_URL || import.meta.env.VITE_SHOP_SUPABASE_URL;
const supabaseTouristKey = import.meta.env.VITE_TOURIST_SUPABASE_ANON_KEY || import.meta.env.VITE_SHOP_SUPABASE_ANON_KEY;

if (!supabaseTouristUrl || !supabaseTouristKey) {
  console.error("Tourist Places Supabase credentials missing!");
}

const supabaseTourist = createClient(supabaseTouristUrl || '', supabaseTouristKey || '');

export default function SeeAndDoManagerPage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [view, setView] = useState("places");
  const [loading, setLoading] = useState(false);

  // Fetch all tourist places and categories
  useEffect(() => {
    fetchCategories();
    fetchPlaces();
  }, []);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabaseTourist
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  };

  // Fetch all tourist places
  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseTourist
        .from('tourist_places')
        .select(`
          id, name, description, address, latitude, longitude, contact_phone, 
          contact_email, opening_hours, rating, review_count, image_url, 
          other_images, map_embed, love_count, near_station, is_recommended, 
          created_at, updated_at, category_id,
          categories:category_id (name)
        `)
        .order('name');
      
      if (error) throw error;
      setPlaces(data);
    } catch (error) {
      console.error('Error fetching tourist places:', error.message);
      // Fallback: Fetch places without join and map category names
      try {
        const { data: placesData, error: placesError } = await supabaseTourist
          .from('tourist_places')
          .select('*')
          .order('name');
        
        if (placesError) throw placesError;
        
        // Map category_id to category name
        const enrichedPlaces = await Promise.all(placesData.map(async (place) => {
          if (place.category_id) {
            const { data: categoryData, error: categoryError } = await supabaseTourist
              .from('categories')
              .select('name')
              .eq('id', place.category_id)
              .single();
            
            if (categoryError) {
              console.error(`Error fetching category for place ${place.id}:`, categoryError.message);
              return { ...place, categories: { name: 'N/A' } };
            }
            return { ...place, categories: { name: categoryData.name } };
          }
          return { ...place, categories: { name: 'N/A' } };
        }));
        
        setPlaces(enrichedPlaces);
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setView("editPlace");
  };

  // Handle new place creation
  const handleNewPlace = () => {
    setSelectedPlace({
      name: "",
      description: "",
      category_id: "",
      address: "",
      latitude: null,
      longitude: null,
      contact_phone: "",
      contact_email: "",
      opening_hours: "",
      near_station: "",
      image_url: "",
      other_images: [],
      is_recommended: false,
      rating: 0,
      review_count: 0,
      love_count: 0
    });
    setView("editPlace");
  };

  // Handle saving place
  const handleSavePlace = async (placeData) => {
    setLoading(true);
    try {
      // Remove temporary fields before saving
      const { map_embed, categories, ...saveData } = placeData; // Exclude categories object

      if (saveData.id) {
        // Update existing place
        const { data, error } = await supabaseTourist
          .from('tourist_places')
          .update(saveData)
          .eq('id', saveData.id)
          .select(`
            id, name, description, address, latitude, longitude, contact_phone, 
            contact_email, opening_hours, rating, review_count, image_url, 
            other_images, map_embed, love_count, near_station, is_recommended, 
            created_at, updated_at, category_id,
            categories:category_id (name)
          `);
        
        if (error) throw error;
        
        // Update local state
        setPlaces(places.map(place => 
          place.id === saveData.id ? data[0] : place
        ));
        setSelectedPlace(data[0]);
      } else {
        // Create new place
        const { data, error } = await supabaseTourist
          .from('tourist_places')
          .insert([saveData])
          .select(`
            id, name, description, address, latitude, longitude, contact_phone, 
            contact_email, opening_hours, rating, review_count, image_url, 
            other_images, map_embed, love_count, near_station, is_recommended, 
            created_at, updated_at, category_id,
            categories:category_id (name)
          `);
        
        if (error) throw error;
        
        // Update local state
        setPlaces([...places, data[0]]);
        setSelectedPlace(data[0]);
      }
      
      setView("places");
    } catch (error) {
      console.error('Error saving tourist place:', error.message);
      alert('Error saving tourist place: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting place
  const handleDeletePlace = async (placeId) => {
    if (!window.confirm("Are you sure you want to delete this tourist place?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabaseTourist
        .from('tourist_places')
        .delete()
        .eq('id', placeId);
      
      if (error) throw error;
      
      // Update local state
      setPlaces(places.filter(place => place.id !== placeId));
      setSelectedPlace(null);
      setView("places");
    } catch (error) {
      console.error('Error deleting tourist place:', error.message);
      alert('Error deleting tourist place: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              See and Do Management
            </h1>
            <p className="text-gray-400 mt-1">
              {view === "places" && "Manage your tourist places"}
              {view === "editPlace" && (selectedPlace?.id ? "Edit tourist place details" : "Create a new tourist place")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {view === "places" && (
              <button 
                onClick={handleNewPlace}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Place
              </button>
            )}
            {view === "editPlace" && (
              <button 
                onClick={() => setView("places")}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Places
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
            {view === "places" && (
              <PlaceList 
                places={places}
                onPlaceSelect={handlePlaceSelect}
                onPlaceDelete={handleDeletePlace}
              />
            )}

            {view === "editPlace" && (
              <PlaceEditor 
                place={selectedPlace}
                categories={categories}
                onSave={handleSavePlace}
                onCancel={() => setView("places")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// PlaceList Component
function PlaceList({ places, onPlaceSelect, onPlaceDelete }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">All Tourist Places</h2>
        <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
          {places.length} {places.length === 1 ? 'Place' : 'Places'}
        </span>
      </div>
      
      {places.length === 0 ? (
        <div className="text-center py-16 bg-gray-700/50 rounded-xl">
          <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">No tourist places found. Create your first place!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map(place => (
            <div key={place.id} className="bg-gray-700 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-600">
              <div className="h-48 bg-gray-600 flex items-center justify-center overflow-hidden relative">
                {place.image_url ? (
                  <img 
                    src={place.image_url} 
                    alt={place.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-6xl">
                    🏞️
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  {place.is_recommended && (
                    <span className="bg-indigo-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Recommended
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-xl mb-2 text-white">{place.name}</h3>
                <p className="text-indigo-300 text-sm mb-3 capitalize">{place.categories?.name || 'N/A'}</p>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{place.description}</p>
                
                {place.near_station && (
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Near: {place.near_station}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Rating: {place.rating} ({place.review_count} reviews)
                </div>

                <div className="flex mt-6 space-x-3">
                  <button 
                    onClick={() => onPlaceSelect(place)}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </button>
                  <button 
                    onClick={() => onPlaceDelete(place.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// PlaceEditor Component
function PlaceEditor({ place, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    ...place,
    other_images: place.other_images || [],
    map_embed: '',
    opening_hours: place.opening_hours || "",
    near_station: place.near_station || "",
    rating: place.rating || 0,
    review_count: place.review_count || 0,
    love_count: place.love_count || 0,
    category_id: place.category_id || ""
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingOther, setUploadingOther] = useState(false);

  const extractLatLng = (embedCode) => {
    if (!embedCode) return { lat: null, lng: null };
    const match = embedCode.match(/src="([^"]+)"/);
    if (!match) return { lat: null, lng: null };
    const src = match[1];
    const lngMatch = src.match(/!2d([-\d.]+)/);
    const latMatch = src.match(/!3d([-\d.]+)/);
    return {
      lat: latMatch ? parseFloat(latMatch[1]) : null,
      lng: lngMatch ? parseFloat(lngMatch[1]) : null
    };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));

    if (name === 'map_embed') {
      const { lat, lng } = extractLatLng(value);
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Upload main place image
  const uploadImage = async (e) => {
    try {
      setUploading(true);
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `place-images/${fileName}`;
      
      const { error: uploadError } = await supabaseTourist.storage
        .from('place-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabaseTourist.storage
        .from('place-images')
        .getPublicUrl(filePath);
      
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      
    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Remove main place image
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  // Upload other images
  const uploadOtherImage = async (e) => {
    try {
      setUploadingOther(true);
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `place-other-images/${fileName}`;
      
      const { error: uploadError } = await supabaseTourist.storage
        .from('place-other-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabaseTourist.storage
        .from('place-other-images')
        .getPublicUrl(filePath);
      
      setFormData((prev) => ({ ...prev, other_images: [...prev.other_images, publicUrl] }));
      
    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingOther(false);
    }
  };

  // Remove other image
  const removeOtherImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      other_images: prev.other_images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-white">{place.id ? "Edit Tourist Place" : "Create New Tourist Place"}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Basic Information
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Place Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Location Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Near Station *</label>
                  <input
                    type="text"
                    name="near_station"
                    value={formData.near_station}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nearest station or landmark"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Opening Hours</label>
                  <input
                    type="text"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 9:00 AM - 6:00 PM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Google Maps Embed Code</label>
                  <textarea
                    name="map_embed"
                    value={formData.map_embed}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Paste the iframe embed code from Google Maps"
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    {formData.latitude && formData.longitude 
                      ? `Extracted location: Latitude ${formData.latitude}, Longitude ${formData.longitude}` 
                      : 'Paste embed code to extract location'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Contact & Images */}
          <div className="space-y-6">
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact Information
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Review Count</label>
                  <input
                    type="number"
                    name="review_count"
                    value={formData.review_count}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Love Count</label>
                  <input
                    type="number"
                    name="love_count"
                    value={formData.love_count}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_recommended"
                    name="is_recommended"
                    checked={formData.is_recommended}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded bg-gray-600"
                  />
                  <label htmlFor="is_recommended" className="ml-3 block text-sm text-gray-300 font-medium">
                    Recommended
                  </label>
                </div>
              </div>
            </div>
            
            {/* Image Upload Section */}
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Place Images
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Main Image</label>
                  <div className="flex items-center space-x-4">
                    {formData.image_url ? (
                      <div className="relative group">
                        <img src={formData.image_url} alt="Place" className="h-28 w-28 object-cover rounded-lg shadow-md border border-gray-600" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-gray-600 border-2 border-dashed border-gray-500 rounded-lg h-28 w-28 flex items-center justify-center hover:border-indigo-400 transition-colors">
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-400"></div>
                        ) : (
                          <span className="text-gray-400 text-3xl">+</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={uploadImage}
                          className="sr-only"
                          disabled={uploading}
                        />
                      </label>
                    )}
                    <div>
                      <p className="text-sm text-gray-400">Main display image (recommended 300x300px)</p>
                      {formData.image_url && (
                        <label className="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                          Replace Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={uploadImage}
                            className="sr-only"
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Other Images</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {formData.other_images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Place image ${index + 1}`} className="h-28 w-28 object-cover rounded-lg shadow-md border border-gray-600" />
                        <button
                          type="button"
                          onClick={() => removeOtherImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    <label className="cursor-pointer bg-gray-600 border-2 border-dashed border-gray-500 rounded-lg h-28 w-28 flex items-center justify-center hover:border-indigo-400 transition-colors">
                      {uploadingOther ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-400"></div>
                      ) : (
                        <span className="text-gray-400 text-3xl">+</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadOtherImage}
                        className="sr-only"
                        disabled={uploadingOther}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-400">Additional images (recommended 300x300px)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
          >
            {place.id ? "Update Place" : "Create Place"}
          </button>
        </div>
      </form>
    </div>
  );
}