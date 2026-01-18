import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Palette, Save, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hexToHsl, isValidHex, hasGoodContrastWithWhite } from "@/lib/colors";

interface MenuAppearanceSettingsProps {
  establishmentId: string;
  initialPrimaryColor?: string | null;
  initialSecondaryColor?: string | null;
  initialMenuTheme?: string | null;
  onUpdate?: () => void;
}

const COLOR_SUGGESTIONS = [
  { name: "Azul", hex: "#4A9BD9", description: "Confiança, tecnologia" },
  { name: "Verde", hex: "#4CAF50", description: "Natureza, saúde" },
  { name: "Vermelho", hex: "#E53935", description: "Pizzarias, fast food" },
  { name: "Laranja", hex: "#FF9800", description: "Energia, apetite" },
  { name: "Roxo", hex: "#7E57C2", description: "Premium, sofisticação" },
  { name: "Rosa", hex: "#EC407A", description: "Docerias, feminino" },
  { name: "Ciano", hex: "#26C6DA", description: "Frescor, modernidade" },
  { name: "Amarelo", hex: "#FDD835", description: "Alegria, promoções" },
];

export function MenuAppearanceSettings({
  establishmentId,
  initialPrimaryColor,
  initialSecondaryColor,
  initialMenuTheme,
  onUpdate,
}: MenuAppearanceSettingsProps) {
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || "#4A9BD9");
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor || "#4CAF50");
  const [menuTheme, setMenuTheme] = useState(initialMenuTheme || "light");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialPrimaryColor) setPrimaryColor(initialPrimaryColor);
    if (initialSecondaryColor) setSecondaryColor(initialSecondaryColor);
    if (initialMenuTheme) setMenuTheme(initialMenuTheme);
  }, [initialPrimaryColor, initialSecondaryColor, initialMenuTheme]);

  const handleSave = async () => {
    if (!isValidHex(primaryColor) || !isValidHex(secondaryColor)) {
      toast.error("Formato de cor inválido. Use o formato #RRGGBB");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("establishments")
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          menu_theme: menuTheme,
        })
        .eq("id", establishmentId);

      if (error) throw error;

      toast.success("Aparência salva com sucesso!");
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao salvar aparência:", error);
      toast.error("Erro ao salvar aparência");
    } finally {
      setSaving(false);
    }
  };

  const primaryContrastWarning = !hasGoodContrastWithWhite(primaryColor);
  const secondaryContrastWarning = !hasGoodContrastWithWhite(secondaryColor);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Aparência do Cardápio
        </CardTitle>
        <CardDescription>
          Personalize as cores e o tema do seu cardápio digital
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Cores */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Cor Principal</Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded-md border-2 border-border flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <Input
                id="primary-color"
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#4A9BD9"
                className="font-mono"
              />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
            </div>
            {primaryContrastWarning && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Cor clara pode dificultar leitura de textos brancos
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color">Cor Secundária</Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded-md border-2 border-border flex-shrink-0"
                style={{ backgroundColor: secondaryColor }}
              />
              <Input
                id="secondary-color"
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#4CAF50"
                className="font-mono"
              />
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
            </div>
            {secondaryContrastWarning && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Cor clara pode dificultar leitura de textos brancos
              </p>
            )}
          </div>
        </div>

        {/* Sugestões de Cores */}
        <div className="space-y-2">
          <Label>Sugestões de cores</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_SUGGESTIONS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setPrimaryColor(color.hex)}
                className="group relative w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.hex }}
                title={`${color.name}: ${color.description}`}
              >
                {primaryColor === color.hex && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tema Padrão */}
        <div className="space-y-3">
          <Label>Tema padrão do cardápio</Label>
          <RadioGroup value={menuTheme} onValueChange={setMenuTheme}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light" className="font-normal cursor-pointer">
                Claro (recomendado)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark" className="font-normal cursor-pointer">
                Escuro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system" className="font-normal cursor-pointer">
                Seguir preferência do cliente
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Pré-visualização */}
        <div className="space-y-2">
          <Label>Pré-visualização</Label>
          <div 
            className="rounded-lg overflow-hidden border border-border"
            style={{ 
              background: menuTheme === "dark" ? "#1a1a1a" : "#ffffff" 
            }}
          >
            {/* Header Preview */}
            <div
              className="p-4"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20" />
                <div>
                  <h3 className="text-white font-semibold">Seu Estabelecimento</h3>
                  <p className="text-white/80 text-sm">Aberto agora</p>
                </div>
              </div>
            </div>
            
            {/* Content Preview */}
            <div className="p-4" style={{ color: menuTheme === "dark" ? "#fff" : "#1a1a1a" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Produto Exemplo</p>
                  <p className="text-sm opacity-60">Descrição do produto</p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Aparência"}
        </Button>
      </CardContent>
    </Card>
  );
}
