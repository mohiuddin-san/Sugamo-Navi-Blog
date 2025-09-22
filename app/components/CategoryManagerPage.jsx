import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_TOURIST_SUPABASE_URL || import.meta.env.VITE_SHOP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_TOURIST_SUPABASE_ANON_KEY || import.meta.env.VITE_SHOP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing!");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("both"); // Default to "both"
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      alert('Error fetching categories: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name cannot be empty");
      return;
    }
    if (!newCategoryType) {
      alert("Category type cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const newCategory = {
        id: uuidv4(),
        name: newCategoryName.trim(),
        type: newCategoryType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('categories')
        .insert([newCategory]);
      
      if (error) throw error;
      
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setNewCategoryType("both");
    } catch (error) {
      console.error('Error adding category:', error.message);
      alert('Error adding category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle editing category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
  };

  // Handle updating category
  const handleUpdateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name cannot be empty");
      return;
    }
    if (!newCategoryType) {
      alert("Category type cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          name: newCategoryName.trim(), 
          type: newCategoryType,
          updated_at: new Date().toISOString() 
        })
        .eq('id', editingCategory.id);
      
      if (error) throw error;
      
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { 
          ...cat, 
          name: newCategoryName.trim(), 
          type: newCategoryType,
          updated_at: new Date().toISOString() 
        } : cat
      ));
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryType("both");
    } catch (error) {
      console.error('Error updating category:', error.message);
      alert('Error updating category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category? Ensure no places or shops are using it.")) return;
    
    setLoading(true);
    try {
      // Optional: Check if category is used
      const { data: shopCount } = await supabase
        .from('shops')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);
      const { data: placeCount } = await supabase
        .from('tourist_places')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);
      if (shopCount.length > 0 || placeCount.length > 0) {
        alert('Cannot delete category: It is used by shops or places.');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      
      setCategories(categories.filter(category => category.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error.message);
      alert('Error deleting category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Category Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage categories for tourist places and shops
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-100 mb-4">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value)}
                  className="px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="both">Both</option>
                  <option value="shop">Shop</option>
                  <option value="place">Tourist Place</option>
                </select>
                {editingCategory ? (
                  <div className="flex gap-4">
                    <button
                      onClick={handleUpdateCategory}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      Update Category
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCategoryName("");
                        setNewCategoryType("both");
                      }}
                      className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddCategory}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Category
                  </button>
                )}
              </div>
              {categories.length === 0 ? (
                <div className="text-center py-8 bg-gray-700/50 rounded-xl">
                  <p className="text-gray-400 text-lg">No categories found. Add a category to start!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div key={category.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="text-white">{category.name}</span>
                        <span className="text-gray-400 text-sm ml-2">({category.type})</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}