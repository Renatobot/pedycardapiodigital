import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  folder?: string;
  className?: string;
  placeholder?: React.ReactNode;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

// Compress and resize image before upload
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      
      // Resize maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Falha ao criar contexto do canvas'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Falha na compressão da imagem')),
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Erro ao carregar imagem'));
    };
  });
};

export function ImageUpload({ 
  value, 
  onChange, 
  folder = 'products',
  className = '',
  placeholder,
  onUploadStart,
  onUploadEnd
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate original file size (max 10MB to prevent browser freeze)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem original deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      // Compress image before upload
      const compressedBlob = await compressImage(file);
      
      // Check size after compression (max 1MB)
      if (compressedBlob.size > 1 * 1024 * 1024) {
        throw new Error('Imagem muito grande mesmo após compressão. Tente outra imagem.');
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({
        title: 'Imagem enviada!',
        description: 'A imagem foi otimizada e carregada com sucesso.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: error.message || 'Ocorreu um erro ao enviar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      onUploadEnd?.();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      
      {value ? (
        <div className="relative h-full overflow-hidden rounded-lg bg-muted/30">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-contain rounded-lg"
          />
          {/* Botões sempre visíveis no canto superior direito */}
          <div className="absolute top-1 right-1 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-7 w-7 shadow-sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : placeholder ? (
            placeholder
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Enviar imagem</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
