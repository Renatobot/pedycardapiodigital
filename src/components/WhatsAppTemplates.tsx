import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageCircle, Plus, Edit, Trash2, Copy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
  sort_order: number;
}

interface WhatsAppTemplatesProps {
  establishmentId: string;
}

const DEFAULT_TEMPLATES = [
  { name: 'Pedido Confirmado', message: 'Olá! Seu pedido foi confirmado e está sendo preparado. Obrigado pela preferência! 😊' },
  { name: 'Saiu para Entrega', message: 'Boa notícia! Seu pedido saiu para entrega. Em breve chegará até você! 🚀' },
  { name: 'Pedido Entregue', message: 'Seu pedido foi entregue! Esperamos que goste. Obrigado e volte sempre! ⭐' },
  { name: 'Atraso na Entrega', message: 'Olá! Pedimos desculpas, mas houve um pequeno atraso. Seu pedido chegará em instantes. Agradecemos a compreensão! 🙏' },
  { name: 'Produto Indisponível', message: 'Olá! Infelizmente um item do seu pedido está indisponível no momento. Podemos substituir ou remover? Aguardamos retorno.' },
];

export function WhatsAppTemplates({ establishmentId }: WhatsAppTemplatesProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    message: '',
  });

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('sort_order');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [establishmentId]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({ name: '', message: '' });
    setModalOpen(true);
  };

  const openEditModal = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setFormData({ name: template.name, message: template.message });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.message.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('whatsapp_templates')
          .update({ name: formData.name, message: formData.message })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: 'Template atualizado!' });
      } else {
        const { error } = await supabase
          .from('whatsapp_templates')
          .insert({
            establishment_id: establishmentId,
            name: formData.name,
            message: formData.message,
            sort_order: templates.length,
          });

        if (error) throw error;
        toast({ title: 'Template criado!' });
      }

      setModalOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', deletingTemplate.id);

      if (error) throw error;

      toast({ title: 'Template excluído!' });
      setDeleteDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: 'Copiado!',
      description: 'Mensagem copiada para a área de transferência.',
    });
  };

  const addDefaultTemplate = async (template: { name: string; message: string }) => {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .insert({
          establishment_id: establishmentId,
          name: template.name,
          message: template.message,
          sort_order: templates.length,
        });

      if (error) throw error;
      toast({ title: 'Template adicionado!' });
      fetchTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Templates de Resposta WhatsApp
            </div>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing templates */}
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum template criado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{template.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(template.message)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditModal(template)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          setDeletingTemplate(template);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Suggested templates */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Templates Sugeridos</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TEMPLATES.filter(
                (dt) => !templates.some((t) => t.name === dt.name)
              ).map((template) => (
                <Badge
                  key={template.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => addDefaultTemplate(template)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input
                placeholder="Ex: Pedido Confirmado"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite a mensagem que será enviada..."
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingTemplate?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
