'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { useCallback } from 'react';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Write something...',
}: RichTextEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      overflow="hidden"
      w="full"
    >
      <Flex
        gap={1}
        p={2}
        borderBottomWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
        bg={{ base: 'gray.50', _dark: 'gray.800' }}
        flexWrap="wrap"
      >
        <IconButton
          size="sm"
          variant={editor.isActive('bold') ? 'solid' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('italic') ? 'solid' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? 'solid' : 'ghost'}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          aria-label="Heading 1"
        >
          <Heading1 size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'solid' : 'ghost'}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Heading 2"
        >
          <Heading2 size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('bulletList') ? 'solid' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          <List size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('orderedList') ? 'solid' : 'ghost'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
        >
          <ListOrdered size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('codeBlock') ? 'solid' : 'ghost'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code Block"
        >
          <Code size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={editor.isActive('link') ? 'solid' : 'ghost'}
          onClick={addLink}
          aria-label="Link"
        >
          <LinkIcon size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant="ghost"
          onClick={addImage}
          aria-label="Image"
        >
          <ImageIcon size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant="ghost"
          onClick={addTable}
          aria-label="Table"
        >
          <TableIcon size={16} />
        </IconButton>
        <Box flex="1" />
        <IconButton
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo size={16} />
        </IconButton>
      </Flex>
      <Box
        bg={{ base: 'white', _dark: 'gray.900' }}
        css={{
          '& .ProseMirror': {
            minHeight: '200px',
            padding: '1rem',
            outline: 'none',
          },
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
            content: `"${placeholder}"`,
            color: 'var(--chakra-colors-gray-400)',
            pointerEvents: 'none',
            height: 0,
            float: 'left',
          },
          '& .ProseMirror img': {
            maxWidth: '100%',
            height: 'auto',
          },
          '& .ProseMirror table': {
            borderCollapse: 'collapse',
            width: '100%',
            marginTop: '1rem',
            marginBottom: '1rem',
          },
          '& .ProseMirror table td, & .ProseMirror table th': {
            border: '1px solid var(--chakra-colors-gray-300)',
            padding: '0.5rem',
          },
          '& .ProseMirror table th': {
            backgroundColor: 'var(--chakra-colors-gray-100)',
            fontWeight: 'bold',
          },
          '& .ProseMirror pre': {
            backgroundColor: 'var(--chakra-colors-gray-100)',
            borderRadius: '0.375rem',
            padding: '1rem',
            overflow: 'auto',
          },
          '& .ProseMirror code': {
            backgroundColor: 'var(--chakra-colors-gray-100)',
            borderRadius: '0.25rem',
            padding: '0.125rem 0.25rem',
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};
