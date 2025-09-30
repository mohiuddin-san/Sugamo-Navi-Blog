import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

type Language = "en" | "ja";

const shopTranslations = {
  en: {
    shopManagement: "Shop Management",
    manageShops: "Manage your shops and inventory",
    editShopDetails: "Edit shop details",
    createNewShop: "Create a new shop",
    createOffers: "Create and manage special offers",
    manageFeatured: "Manage featured recommendations",
    addNewShop: "Add New Shop",
    manageOffers: "Manage Offers",
    recommendations: "Recommendations",
    backToShops: "Back to Shops",
    allShops: "All Shops",
    shops: "Shops",
    shop: "Shop",
    noShopsFound: "No shops found. Create your first shop!",
    recommended: "Recommended",
    bestShop: "Best Shop",
    near: "Near",
    edit: "Edit",
    editShop: "Edit Shop",
    createShop: "Create New Shop",
    basicInformation: "Basic Information",
    shopName: "Shop Name",
    category: "Category",
    selectCategory: "Select a category",
    description: "Description",
    locationDetails: "Location Details",
    address: "Address",
    nearStation: "Near Station",
    nearestStation: "Nearest station or landmark",
    openingHours: "Opening Hours",
    openingHoursPlaceholder: "e.g., 9:00 AM - 6:00 PM",
    googleMapsEmbed: "Google Maps Embed Code",
    pasteEmbedCode: "Paste the iframe embed code from Google Maps",
    extractedLocation: "Extracted location",
    latitude: "Latitude",
    longitude: "Longitude",
    pasteEmbedExtract: "Paste embed code to extract location",
    contactInformation: "Contact Information",
    contactPhone: "Contact Phone",
    contactEmail: "Contact Email",
    shopImages: "Shop Images",
    shopMainImage: "Shop Main Image",
    mainDisplayImage: "Main display image (recommended 300x300px)",
    replaceImage: "Replace Image",
    otherImages: "Other Images (Interior, Food, etc.)",
    additionalImages: "Additional images (recommended 300x300px)",
    cancel: "Cancel",
    updateShop: "Update Shop",
    createShopBtn: "Create Shop",
    loading: "Loading...",
    manageOffersTitle: "Manage Offers",
    newOffer: "New Offer",
    editOffer: "Edit Offer",
    createNewOffer: "Create New Offer",
    title: "Title",
    discount: "Discount (%)",
    validUntil: "Valid Until",
    offerImage: "Offer Image",
    offerImageSize: "Offer image (recommended 300x300px)",
    updateOffer: "Update Offer",
    createOfferBtn: "Create Offer",
    manageRecommendationsTitle: "Manage Recommendations",
    newRecommendation: "New Recommendation",
    editRecommendation: "Edit Recommendation",
    createNewRecommendation: "Create New Recommendation",
    priority: "Priority",
    updateRecommendation: "Update Recommendation",
    createRecommendationBtn: "Create Recommendation",
    delete: "Delete",
    deleteShopConfirm: "Are you sure you want to delete this shop?",
    deleteOfferConfirm: "Are you sure you want to delete this offer?",
    deleteRecommendationConfirm: "Are you sure you want to delete this recommendation?",
    errorUploadingImage: "Error uploading image",
    mustSelectImage: "You must select an image to upload.",
    errorSavingShop: "Error saving shop",
    errorSavingOffer: "Error saving offer",
    errorSavingRecommendation: "Error saving recommendation",
    noCategory: "No Category"
  },
  ja: {
    shopManagement: "ショップ管理",
    manageShops: "ショップと在庫を管理",
    editShopDetails: "ショップ詳細を編集",
    createNewShop: "新しいショップを作成",
    createOffers: "特別オファーを作成・管理",
    manageFeatured: "おすすめを管理",
    addNewShop: "新しいショップを追加",
    manageOffers: "オファー管理",
    recommendations: "おすすめ",
    backToShops: "ショップに戻る",
    allShops: "すべてのショップ",
    shops: "店舗",
    shop: "店舗",
    noShopsFound: "ショップが見つかりません。最初のショップを作成してください！",
    recommended: "おすすめ",
    bestShop: "ベストショップ",
    near: "近く",
    edit: "編集",
    editShop: "ショップを編集",
    createShop: "新しいショップを作成",
    basicInformation: "基本情報",
    shopName: "ショップ名",
    category: "カテゴリー",
    selectCategory: "カテゴリーを選択",
    description: "説明",
    locationDetails: "場所の詳細",
    address: "住所",
    nearStation: "最寄り駅",
    nearestStation: "最寄りの駅またはランドマーク",
    openingHours: "営業時間",
    openingHoursPlaceholder: "例: 9:00 AM - 6:00 PM",
    googleMapsEmbed: "Google マップ埋め込みコード",
    pasteEmbedCode: "Google マップからiframe埋め込みコードを貼り付け",
    extractedLocation: "抽出された場所",
    latitude: "緯度",
    longitude: "経度",
    pasteEmbedExtract: "埋め込みコードを貼り付けて場所を抽出",
    contactInformation: "連絡先情報",
    contactPhone: "電話番号",
    contactEmail: "メールアドレス",
    shopImages: "ショップ画像",
    shopMainImage: "ショップメイン画像",
    mainDisplayImage: "メイン表示画像（推奨: 300x300px）",
    replaceImage: "画像を置き換える",
    otherImages: "その他の画像（インテリア、食べ物など）",
    additionalImages: "追加画像（推奨: 300x300px）",
    cancel: "キャンセル",
    updateShop: "ショップを更新",
    createShopBtn: "ショップを作成",
    loading: "読み込み中...",
    manageOffersTitle: "オファー管理",
    newOffer: "新しいオファー",
    editOffer: "オファーを編集",
    createNewOffer: "新しいオファーを作成",
    title: "タイトル",
    discount: "割引（%）",
    validUntil: "有効期限",
    offerImage: "オファー画像",
    offerImageSize: "オファー画像（推奨: 300x300px）",
    updateOffer: "オファーを更新",
    createOfferBtn: "オファーを作成",
    manageRecommendationsTitle: "おすすめ管理",
    newRecommendation: "新しいおすすめ",
    editRecommendation: "おすすめを編集",
    createNewRecommendation: "新しいおすすめを作成",
    priority: "優先度",
    updateRecommendation: "おすすめを更新",
    createRecommendationBtn: "おすすめを作成",
    delete: "削除",
    deleteShopConfirm: "このショップを削除してもよろしいですか？",
    deleteOfferConfirm: "このオファーを削除してもよろしいですか？",
    deleteRecommendationConfirm: "このおすすめを削除してもよろしいですか？",
    errorUploadingImage: "画像のアップロードエラー",
    mustSelectImage: "アップロードする画像を選択する必要があります。",
    errorSavingShop: "ショップの保存エラー",
    errorSavingOffer: "オファーの保存エラー",
    errorSavingRecommendation: "おすすめの保存エラー",
    noCategory: "カテゴリーなし"
  }
};
const supabaseShopUrl = import.meta.env.VITE_SHOP_SUPABASE_URL;
const supabaseShopKey = import.meta.env.VITE_SHOP_SUPABASE_ANON_KEY;

if (!supabaseShopUrl || !supabaseShopKey) {
  console.error("Shop Supabase credentials missing!");
}

const supabaseShop = createClient(supabaseShopUrl || '', supabaseShopKey || '');
type ShopManagerProps = {
  language: Language;
};
export default function ShopApp({ language = "en" }: ShopManagerProps){
  const [shops, setShops] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [view, setView] = useState("shops");
  const [loading, setLoading] = useState(false);
  const t = shopTranslations[language];
  useEffect(() => {
    fetchShops();
    fetchOffers();
    fetchRecommendations();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabaseShop
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseShop
        .from('shops')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabaseShop
        .from('offers')
        .select(`
          *,
          shops (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error.message);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabaseShop
        .from('recommendations')
        .select(`
          *,
          shops (name)
        `)
        .order('priority');
      
      if (error) throw error;
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error.message);
    }
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    setView("editShop");
  };

  const handleNewShop = () => {
    setSelectedShop({
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
      is_best_shop: false
    });
    setView("editShop");
  };

  const handleSaveShop = async (shopData) => {
    setLoading(true);
    try {
      const { map_embed, ...saveData } = shopData;
      const formattedData = { ...saveData };

      if (formattedData.id) {
        const { data, error } = await supabaseShop
          .from('shops')
          .update(formattedData)
          .eq('id', formattedData.id)
          .select();
        
        if (error) throw error;
        
        setShops(shops.map(shop => 
          shop.id === formattedData.id ? data[0] : shop
        ));
        setSelectedShop(data[0]);
      } else {
        const { data, error } = await supabaseShop
          .from('shops')
          .insert([formattedData])
          .select();
        
        if (error) throw error;
        
        setShops([...shops, data[0]]);
        setSelectedShop(data[0]);
      }
      
      setView("shops");
    } catch (error) {
      console.error('Error saving shop:', error.message);
      alert(t.errorSavingShop + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (!window.confirm(t.deleteShopConfirm)) return;
    
    setLoading(true);
    try {
      const { error } = await supabaseShop
        .from('shops')
        .delete()
        .eq('id', shopId);
      
      if (error) throw error;
      
      setShops(shops.filter(shop => shop.id !== shopId));
      setSelectedShop(null);
      setView("shops");
    } catch (error) {
      console.error('Error deleting shop:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              {t.shopManagement}
            </h1>
            <p className="text-gray-400 mt-1">
              {view === "shops" && t.manageShops}
              {view === "editShop" && (selectedShop?.id ? t.editShopDetails : t.createNewShop)}
              {view === "offers" && t.createOffers}
              {view === "recommendations" && t.manageFeatured}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {view === "shops" && (
              <>
                <button 
                  onClick={handleNewShop}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {t.addNewShop}
                </button>
                <button 
                  onClick={() => setView("offers")}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 5.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 10l1.293-1.293zm4 0a1 1 0 010 1.414L11.586 10l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.manageOffers}
                </button>
                <button 
                  onClick={() => setView("recommendations")}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-violet-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {t.recommendations}
                </button>
              </>
            )}
            {(view === "editShop" || view === "offers" || view === "recommendations") && (
              <button 
                onClick={() => setView("shops")}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                {t.backToShops}
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          </div>
        )}

        {!loading && (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
            {view === "shops" && (
              <ShopList 
                shops={shops}
                categories={categories}
                onShopSelect={handleShopSelect}
                onShopDelete={handleDeleteShop}
                t={t}
              />
            )}

            {view === "editShop" && (
              <ShopEditor 
                shop={selectedShop}
                categories={categories}
                onSave={handleSaveShop}
                onCancel={() => setView("shops")}
                t={t}
              />
            )}

            {view === "offers" && (
              <OfferManager 
                offers={offers}
                shops={shops}
                onSave={fetchOffers}
                onDelete={fetchOffers}
                t={t}
              />
            )}

            {view === "recommendations" && (
              <RecommendationManager 
                recommendations={recommendations}
                shops={shops}
                onSave={fetchRecommendations}
                onDelete={fetchRecommendations}
                t={t}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopList({ shops, categories, onShopSelect, onShopDelete, t }) {
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : t.noCategory;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">{t.allShops}</h2>
        <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
          {shops.length} {shops.length === 1 ? t.shop : t.shops}
        </span>
      </div>
      
      {shops.length === 0 ? (
        <div className="text-center py-16 bg-gray-700/50 rounded-xl">
          <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-8 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">{t.noShopsFound}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map(shop => (
            <div key={shop.id} className="bg-gray-700 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-600">
              <div className="h-48 bg-gray-600 flex items-center justify-center overflow-hidden relative">
                {shop.image_url ? (
                  <img 
                    src={shop.image_url} 
                    alt={shop.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-6xl">
                    🏪
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  {shop.is_recommended && (
                    <span className="bg-indigo-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {t.recommended}
                    </span>
                  )}
                  {shop.is_best_shop && (
                    <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      {t.bestShop}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-xl mb-2 text-white">{shop.name}</h3>
                <p className="text-indigo-300 text-sm mb-3 capitalize">{getCategoryName(shop.category_id)}</p>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{shop.description}</p>
                
                {shop.near_station && (
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {t.near}: {shop.near_station}
                  </div>
                )}
                
                <div className="flex mt-6 space-x-3">
                  <button 
                    onClick={() => onShopSelect(shop)}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    {t.edit}
                  </button>
                  <button 
                    onClick={() => onShopDelete(shop.id)}
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

function ShopEditor({ shop, categories, onSave, onCancel, t }) {
  console.log('ShopEditor shop prop:', shop);
  const [formData, setFormData] = useState({
    ...shop,
    category_id: shop.category_id || '',
    other_images: shop.other_images || [],
    map_embed: '',
    opening_hours: shop.opening_hours || "",
    near_station: shop.near_station || ""
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
      [name]: type === 'checkbox' ? checked : value
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

  const uploadImage = async (e) => {
    try {
      setUploading(true);
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error(t.mustSelectImage);
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `shop-images/${fileName}`;
      
      const { error: uploadError } = await supabaseShop.storage
        .from('shop-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabaseShop.storage
        .from('shop-images')
        .getPublicUrl(filePath);
      
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      
    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert(t.errorUploadingImage + ': ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const uploadOtherImage = async (e) => {
    try {
      setUploadingOther(true);
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error(t.mustSelectImage);
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `shop-other-images/${fileName}`;
      
      const { error: uploadError } = await supabaseShop.storage
        .from('shop-other-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabaseShop.storage
        .from('shop-other-images')
        .getPublicUrl(filePath);
      
      setFormData((prev) => ({ ...prev, other_images: [...prev.other_images, publicUrl] }));
      
    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert(t.errorUploadingImage + ': ' + error.message);
    } finally {
      setUploadingOther(false);
    }
  };

  const removeOtherImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      other_images: prev.other_images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-white">{shop.id ? t.editShop : t.createShop}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {t.basicInformation}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.shopName} *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.category} *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">{t.selectCategory}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.description}</label>
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
                {t.locationDetails}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.address}</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.nearStation} *</label>
                  <input
                    type="text"
                    name="near_station"
                    value={formData.near_station}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t.nearestStation}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.openingHours}</label>
                  <input
                    type="text"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t.openingHoursPlaceholder}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.googleMapsEmbed}</label>
                  <textarea
                    name="map_embed"
                    value={formData.map_embed}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t.pasteEmbedCode}
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    {formData.latitude && formData.longitude 
                      ? `${t.extractedLocation}: ${t.latitude} ${formData.latitude}, ${t.longitude} ${formData.longitude}` 
                      : t.pasteEmbedExtract}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {t.contactInformation}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.contactPhone}</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.contactEmail}</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
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
                      {t.recommended}
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_best_shop"
                      name="is_best_shop"
                      checked={formData.is_best_shop}
                      onChange={handleChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded bg-gray-600"
                    />
                    <label htmlFor="is_best_shop" className="ml-3 block text-sm text-gray-300 font-medium">
                      {t.bestShop}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 p-5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                {t.shopImages}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">{t.shopMainImage}</label>
                  <div className="flex items-center space-x-4">
                    {formData.image_url ? (
                      <div className="relative group">
                        <img src={formData.image_url} alt="Shop" className="h-28 w-28 object-cover rounded-lg shadow-md border border-gray-600" />
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
                      <p className="text-sm text-gray-400">{t.mainDisplayImage}</p>
                      {formData.image_url && (
                        <label className="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                          {t.replaceImage}
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
                  <label className="block text-sm font-medium text-gray-300 mb-3">{t.otherImages}</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {formData.other_images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Shop image ${index + 1}`} className="h-28 w-28 object-cover rounded-lg shadow-md border border-gray-600" />
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
                  <p className="text-sm text-gray-400">{t.additionalImages}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
          >
            {shop.id ? t.updateShop : t.createShopBtn}
          </button>
        </div>
      </form>
    </div>
  );
}

// OfferManager Component
function OfferManager({ offers, shops, onSave, onDelete, t }) {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [formData, setFormData] = useState({
    shop_id: "",
    title: "",
    description: "",
    discount: "",
    valid_until: "",
    image_url: ""
  });
  const [uploading, setUploading] = useState(false);

  const handleNewOffer = () => {
    setSelectedOffer(null);
    setFormData({
      shop_id: "",
      title: "",
      description: "",
      discount: "",
      valid_until: "",
      image_url: ""
    });
  };

  const handleEditOffer = (offer) => {
    setSelectedOffer(offer);
    setFormData({
      shop_id: offer.shop_id,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      valid_until: offer.valid_until ? new Date(offer.valid_until).toISOString().split('T')[0] : "",
      image_url: offer.image_url || ""
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (selectedOffer) {
        // Update existing offer
        const { error } = await supabaseShop
          .from('offers')
          .update(formData)
          .eq('id', selectedOffer.id);
        
        if (error) throw error;
      } else {
        // Create new offer
        const { error } = await supabaseShop
          .from('offers')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      onSave();
      setSelectedOffer(null);
      setFormData({
        shop_id: "",
        title: "",
        description: "",
        discount: "",
        valid_until: "",
        image_url: ""
      });
    } catch (error) {
      console.error('Error saving offer:', error.message);
      alert(t.errorSavingOffer + ': ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm(t.deleteOfferConfirm)) return;
    
    try {
      const { error } = await supabaseShop
        .from('offers')
        .delete()
        .eq('id', offerId);
      
      if (error) throw error;
      onDelete();
    } catch (error) {
      console.error('Error deleting offer:', error.message);
      alert(t.errorSavingOffer + ': ' + error.message);
    }
  };

  const uploadImage = async (e) => {
    try {
      setUploading(true);
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error(t.mustSelectImage);
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `offer-images/${fileName}`;
      
      const { error: uploadError } = await supabaseShop.storage
        .from('offer-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabaseShop.storage
        .from('offer-images')
        .getPublicUrl(filePath);
      
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      
    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert(t.errorUploadingImage + ': ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">{t.manageOffersTitle}</h2>
        <button
          onClick={handleNewOffer}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {t.newOffer}
        </button>
      </div>

      {selectedOffer !== null && (
        <div className="bg-gray-700 p-5 rounded-xl mb-8">
          <h3 className="text-lg font-medium text-white mb-4">
            {selectedOffer ? t.editOffer : t.createNewOffer}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.shop} *</label>
              <select
                name="shop_id"
                value={formData.shop_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">{t.selectCategory.replace('category', 'shop')}</option> {/* Adjusted for shop selection */}
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.title} *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.description}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.discount}</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.validUntil}</label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">{t.offerImage}</label>
              <div className="flex items-center space-x-4">
                {formData.image_url ? (
                  <div className="relative group">
                    <img src={formData.image_url} alt="Offer" className="h-28 w-28 object-cover rounded-lg shadow-md border border-gray-600" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
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
                <p className="text-sm text-gray-400">{t.offerImageSize}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                disabled={uploading}
              >
                {selectedOffer ? t.updateOffer : t.createOfferBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="bg-gray-700 rounded-xl shadow-md overflow-hidden border border-gray-600">
            <div className="h-48 bg-gray-600 flex items-center justify-center overflow-hidden">
              {offer.image_url ? (
                <img 
                  src={offer.image_url} 
                  alt={offer.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-500 text-6xl">🎁</div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-2 text-white">{offer.title}</h3>
              <p className="text-indigo-300 text-sm mb-2">{offer.shops?.name}</p>
              <p className="text-gray-400 text-sm mb-3">{offer.description}</p>
              <p className="text-gray-400 text-sm mb-3">{t.discount.replace(/ \(%\)/, '')}: {offer.discount}%</p>
              <p className="text-gray-400 text-sm mb-4">
                {t.validUntil}: {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'N/A'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEditOffer(offer)}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {t.edit}
                </button>
                <button
                  onClick={() => handleDeleteOffer(offer.id)}
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
    </div>
  );
}

// RecommendationManager Component
function RecommendationManager({ recommendations, shops, onSave, onDelete, t }) {
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [formData, setFormData] = useState({
    shop_id: "",
    priority: 1,
  });
  const [uploading, setUploading] = useState(false);

  const handleNewRecommendation = () => {
    setSelectedRecommendation(null);
    setFormData({
      shop_id: "",
      priority: 1,
    });
  };

  const handleEditRecommendation = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setFormData({
      shop_id: recommendation.shop_id,
      priority: recommendation.priority,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (selectedRecommendation) {
        // Update existing recommendation
        const { error } = await supabaseShop
          .from('recommendations')
          .update(formData)
          .eq('id', selectedRecommendation.id);
        
        if (error) throw error;
      } else {
        // Create new recommendation
        const { error } = await supabaseShop
          .from('recommendations')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      onSave();
      setSelectedRecommendation(null);
      setFormData({
        shop_id: "",
        priority: 1,
      
      });
    } catch (error) {
      console.error('Error saving recommendation:', error.message);
      alert(t.errorSavingRecommendation + ': ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRecommendation = async (recommendationId) => {
    if (!window.confirm(t.deleteRecommendationConfirm)) return;
    
    try {
      const { error } = await supabaseShop
        .from('recommendations')
        .delete()
        .eq('id', recommendationId);
      
      if (error) throw error;
      onDelete();
    } catch (error) {
      console.error('Error deleting recommendation:', error.message);
      alert(t.errorSavingRecommendation + ': ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">{t.manageRecommendationsTitle}</h2>
        <button
          onClick={handleNewRecommendation}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {t.newRecommendation}
        </button>
      </div>

      {selectedRecommendation !== null && (
        <div className="bg-gray-700 p-5 rounded-xl mb-8">
          <h3 className="text-lg font-medium text-white mb-4">
            {selectedRecommendation ? t.editRecommendation : t.createNewRecommendation}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.shop} *</label>
              <select
                name="shop_id"
                value={formData.shop_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">{t.selectCategory.replace('category', 'shop')}</option> {/* Adjusted for shop selection */}
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.priority}</label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setSelectedRecommendation(null)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                disabled={uploading}
              >
                {selectedRecommendation ? t.updateRecommendation : t.createRecommendationBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(recommendation => (
          <div key={recommendation.id} className="bg-gray-700 rounded-xl shadow-md overflow-hidden border border-gray-600">
            <div className="h-48 bg-gray-600 flex items-center justify-center overflow-hidden">
              {recommendation.image_url ? (
                <img 
                  src={recommendation.image_url} 
                  alt={recommendation.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-500 text-6xl">🌟</div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-2 text-white">{recommendation.shops?.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{t.priority}: {recommendation.priority}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEditRecommendation(recommendation)}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {t.edit}
                </button>
                <button
                  onClick={() => handleDeleteRecommendation(recommendation.id)}
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
    </div>
  );
}