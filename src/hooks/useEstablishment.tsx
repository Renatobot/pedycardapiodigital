import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Establishment {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  cpf_cnpj: string;
  whatsapp: string;
  email: string;
  pix_key: string | null;
  trial_start_date: string;
  trial_end_date: string;
  plan_status: string;
  plan_expires_at: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  establishment_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
}

export interface ProductAddition {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  created_at: string;
}

export function useEstablishment() {
  const { user } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [additions, setAdditions] = useState<ProductAddition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstablishment = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setEstablishment(data);

      if (data) {
        await fetchCategories(data.id);
        await fetchProducts(data.id);
      }
    } catch (error) {
      console.error('Error fetching establishment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (establishmentId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    setCategories(data || []);
  };

  const fetchProducts = async (establishmentId: string) => {
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*')
      .eq('establishment_id', establishmentId);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    setProducts(productsData || []);

    // Fetch additions for all products
    if (productsData && productsData.length > 0) {
      const productIds = productsData.map(p => p.id);
      const { data: additionsData } = await supabase
        .from('product_additions')
        .select('*')
        .in('product_id', productIds);
      
      setAdditions(additionsData || []);
    }
  };

  useEffect(() => {
    fetchEstablishment();
  }, [user]);

  // Category operations
  const createCategory = async (name: string) => {
    if (!establishment) return null;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        establishment_id: establishment.id,
        name,
        sort_order: categories.length
      })
      .select()
      .single();

    if (error) throw error;
    setCategories(prev => [...prev, data]);
    return data;
  };

  const updateCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id);

    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
    setProducts(prev => prev.filter(p => p.category_id !== id));
  };

  // Product operations
  const createProduct = async (product: {
    category_id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
  }) => {
    if (!establishment) return null;

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        establishment_id: establishment.id
      })
      .select()
      .single();

    if (error) throw error;
    setProducts(prev => [...prev, data]);
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
      throw new Error('Não foi possível atualizar o produto. Verifique suas permissões.');
    }
    
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
    setAdditions(prev => prev.filter(a => a.product_id !== id));
  };

  // Addition operations
  const createAddition = async (addition: {
    product_id: string;
    name: string;
    price: number;
    image_url?: string;
  }) => {
    const { data, error } = await supabase
      .from('product_additions')
      .insert(addition)
      .select()
      .single();

    if (error) throw error;
    setAdditions(prev => [...prev, data]);
    return data;
  };

  const deleteAddition = async (id: string) => {
    const { error } = await supabase
      .from('product_additions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setAdditions(prev => prev.filter(a => a.id !== id));
  };

  const getProductAdditions = (productId: string) => {
    return additions.filter(a => a.product_id === productId);
  };

  // Slug operations
  const checkSlugAvailable = async (slug: string): Promise<boolean> => {
    if (!establishment) return false;

    const { data } = await supabase
      .from('establishments')
      .select('id')
      .eq('slug', slug)
      .neq('id', establishment.id)
      .maybeSingle();

    return !data; // true se disponível
  };

  const updateSlug = async (newSlug: string) => {
    if (!establishment) throw new Error('Estabelecimento não encontrado');

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (newSlug.length < 3 || !slugRegex.test(newSlug)) {
      throw new Error('URL inválida. Use apenas letras minúsculas, números e hífens (mínimo 3 caracteres)');
    }

    // Check availability
    const isAvailable = await checkSlugAvailable(newSlug);
    if (!isAvailable) {
      throw new Error('Esta URL já está em uso por outro estabelecimento');
    }

    const { error } = await supabase
      .from('establishments')
      .update({ slug: newSlug })
      .eq('id', establishment.id);

    if (error) throw error;
    
    setEstablishment(prev => prev ? { ...prev, slug: newSlug } as any : null);
  };

  return {
    establishment,
    categories,
    products,
    additions,
    loading,
    refetch: fetchEstablishment,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    createAddition,
    deleteAddition,
    getProductAdditions,
    checkSlugAvailable,
    updateSlug,
  };
}
