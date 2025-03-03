import { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CanvasNode,
  CodeArtifactNodeMeta,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import CodeViewerLayout from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer-layout';
import CodeViewer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/code-viewer';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';

interface CodeArtifactNodePreviewProps {
  node: CanvasNode<CodeArtifactNodeMeta>;
  artifactId: string;
}

const CodeArtifactNodePreviewComponent = ({ node, artifactId }: CodeArtifactNodePreviewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(true);
  const setNodeDataByEntity = useSetNodeDataByEntity();

  const handleRequestFix = useCallback((error: string) => {
    console.error('Code artifact error:', error);
  }, []);

  const handleClose = useCallback(() => {
    setIsShowingCodeViewer(false);
  }, []);

  const handleCodeChange = useCallback(
    (updatedCode: string) => {
      if (node?.data?.entityId) {
        setNodeDataByEntity(
          {
            type: 'code',
            entityId: node.data.entityId,
          },
          {
            contentPreview: updatedCode,
          },
        );
      }
    },
    [node?.data?.entityId, setNodeDataByEntity],
  );

  if (!artifactId) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded p-3">
        <span className="text-gray-500">
          {t('codeArtifact.noSelection', 'No code artifact selected')}
        </span>
      </div>
    );
  }

  // Determine which content to show - prefer action result store content, fallback to document content
  const content = node?.data?.contentPreview || '';
  const { language = 'typescript' } = node.data?.metadata || {};
  const isGenerating = node.data?.metadata?.status === 'generating';

  return (
    <div className="h-full bg-white rounded px-4">
      <CodeViewerLayout isShowing={isShowingCodeViewer}>
        {isShowingCodeViewer && (
          <CodeViewer
            code={content}
            language={language}
            title={node.data?.title || t('codeArtifact.defaultTitle', 'Code Artifact')}
            isGenerating={isGenerating}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={handleClose}
            onRequestFix={handleRequestFix}
            onChange={handleCodeChange}
            readOnly={false}
          />
        )}
      </CodeViewerLayout>
    </div>
  );
};

export const CodeArtifactNodePreview = memo(
  CodeArtifactNodePreviewComponent,
  (prevProps, nextProps) =>
    prevProps.artifactId === nextProps.artifactId &&
    prevProps.node?.data?.contentPreview === nextProps.node?.data?.contentPreview,
);
