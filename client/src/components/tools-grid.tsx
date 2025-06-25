import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  bgColor: string;
  textColor: string;
  category: 'core' | 'advanced';
}

const tools: Tool[] = [
  // Core Tools
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one document',
    icon: 'fas fa-object-group',
    bgColor: 'bg-red-100 group-hover:bg-red-200',
    textColor: 'text-red-600',
    category: 'core'
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Extract pages or split PDF into multiple files',
    icon: 'fas fa-scissors',
    bgColor: 'bg-blue-100 group-hover:bg-blue-200',
    textColor: 'text-blue-600',
    category: 'core'
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: 'fas fa-compress-arrows-alt',
    bgColor: 'bg-green-100 group-hover:bg-green-200',
    textColor: 'text-green-600',
    category: 'core'
  },
  {
    id: 'edit',
    name: 'Edit PDF',
    description: 'Add text, images, and shapes to your PDF',
    icon: 'fas fa-edit',
    bgColor: 'bg-purple-100 group-hover:bg-purple-200',
    textColor: 'text-purple-600',
    category: 'core'
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF to editable Word document',
    icon: 'fas fa-file-word',
    bgColor: 'bg-blue-100 group-hover:bg-blue-200',
    textColor: 'text-blue-700',
    category: 'core'
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables and data to Excel format',
    icon: 'fas fa-file-excel',
    bgColor: 'bg-green-100 group-hover:bg-green-200',
    textColor: 'text-green-700',
    category: 'core'
  },
  {
    id: 'pdf-to-powerpoint',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF to editable presentation',
    icon: 'fas fa-file-powerpoint',
    bgColor: 'bg-orange-100 group-hover:bg-orange-200',
    textColor: 'text-orange-600',
    category: 'core'
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert PDF pages to high-quality images',
    icon: 'fas fa-file-image',
    bgColor: 'bg-pink-100 group-hover:bg-pink-200',
    textColor: 'text-pink-600',
    category: 'core'
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages to correct orientation',
    icon: 'fas fa-redo',
    bgColor: 'bg-indigo-100 group-hover:bg-indigo-200',
    textColor: 'text-indigo-600',
    category: 'core'
  },
  {
    id: 'crop',
    name: 'Crop PDF',
    description: 'Remove unwanted margins and content',
    icon: 'fas fa-crop',
    bgColor: 'bg-yellow-100 group-hover:bg-yellow-200',
    textColor: 'text-yellow-600',
    category: 'core'
  },
  {
    id: 'watermark',
    name: 'Add Watermark',
    description: 'Add text or image watermarks to PDF',
    icon: 'fas fa-stamp',
    bgColor: 'bg-teal-100 group-hover:bg-teal-200',
    textColor: 'text-teal-600',
    category: 'core'
  },
  {
    id: 'sign',
    name: 'Sign PDF',
    description: 'Add digital signatures to documents',
    icon: 'fas fa-signature',
    bgColor: 'bg-emerald-100 group-hover:bg-emerald-200',
    textColor: 'text-emerald-600',
    category: 'core'
  },
  // Advanced Tools
  {
    id: 'ocr',
    name: 'OCR Text',
    description: 'Extract text from scanned documents',
    icon: 'fas fa-eye',
    bgColor: 'bg-cyan-100 group-hover:bg-cyan-200',
    textColor: 'text-cyan-600',
    category: 'advanced'
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Add password protection and permissions',
    icon: 'fas fa-lock',
    bgColor: 'bg-red-100 group-hover:bg-red-200',
    textColor: 'text-red-600',
    category: 'advanced'
  },
  {
    id: 'unlock',
    name: 'Unlock PDF',
    description: 'Remove password protection from PDF',
    icon: 'fas fa-unlock',
    bgColor: 'bg-green-100 group-hover:bg-green-200',
    textColor: 'text-green-600',
    category: 'advanced'
  },
  {
    id: 'compare',
    name: 'Compare PDFs',
    description: 'Find differences between documents',
    icon: 'fas fa-not-equal',
    bgColor: 'bg-purple-100 group-hover:bg-purple-200',
    textColor: 'text-purple-600',
    category: 'advanced'
  },
  {
    id: 'organize',
    name: 'Organize Pages',
    description: 'Reorder, delete, and arrange pages',
    icon: 'fas fa-sort',
    bgColor: 'bg-orange-100 group-hover:bg-orange-200',
    textColor: 'text-orange-600',
    category: 'advanced'
  },
  {
    id: 'page-numbers',
    name: 'Page Numbers',
    description: 'Add custom page numbering to PDF',
    icon: 'fas fa-list-ol',
    bgColor: 'bg-blue-100 group-hover:bg-blue-200',
    textColor: 'text-blue-600',
    category: 'advanced'
  },
  {
    id: 'redact',
    name: 'Redact Text',
    description: 'Hide sensitive information permanently',
    icon: 'fas fa-eraser',
    bgColor: 'bg-gray-100 group-hover:bg-gray-200',
    textColor: 'text-gray-600',
    category: 'advanced'
  },
  {
    id: 'repair',
    name: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files',
    icon: 'fas fa-wrench',
    bgColor: 'bg-emerald-100 group-hover:bg-emerald-200',
    textColor: 'text-emerald-600',
    category: 'advanced'
  },
];

export default function ToolsGrid() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleToolClick = (tool: Tool) => {
    // Navigate to PDF editor for implemented tools
    const implementedTools = ['merge', 'split', 'compress', 'rotate', 'watermark', 'pdf-to-jpg'];
    
    if (implementedTools.includes(tool.id)) {
      setLocation(`/editor/${tool.id}`);
    } else {
      toast({
        title: `${tool.name} Tool`,
        description: `${tool.name} functionality will be available soon.`,
      });
    }
  };

  const coreTools = tools.filter(tool => tool.category === 'core');
  const advancedTools = tools.filter(tool => tool.category === 'advanced');

  return (
    <>
      {/* Core Tools */}
      <section className="mb-12">
        <h3 className="text-3xl font-bold text-white mb-8 text-center">
          PDF Tools & Features
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {coreTools.map((tool) => (
            <div 
              key={tool.id}
              className="tool-card"
              onClick={() => handleToolClick(tool)}
            >
              <div className="text-center">
                <div className="tool-icon">
                  <i className={`${tool.icon} text-2xl`}></i>
                </div>
                <h4 className="font-semibold text-white mb-2">{tool.name}</h4>
                <p className="text-sm text-gray-300">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Tools */}
      <section className="mb-12">
        <h3 className="text-3xl font-bold text-white mb-8 text-center">
          Advanced Features
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {advancedTools.map((tool) => (
            <div 
              key={tool.id}
              className="tool-card"
              onClick={() => handleToolClick(tool)}
            >
              <div className="text-center">
                <div className="tool-icon">
                  <i className={`${tool.icon} text-2xl`}></i>
                </div>
                <h4 className="font-semibold text-white mb-2">{tool.name}</h4>
                <p className="text-sm text-gray-300">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
