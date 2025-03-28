import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Collapse,
  Button,
  List,
  Empty,
  Typography,
  Dropdown,
  Input,
  Popconfirm,
  message,
  Checkbox,
} from 'antd';
import {
  IconCanvas,
  IconPlus,
  IconSearch,
  IconClose,
  IconDelete,
  IconRemove,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { iconClassName } from '@refly-packages/ai-workspace-common/components/project/project-directory';
import { useCreateCanvas } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-canvas';
import cn from 'classnames';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SiderData } from '@refly-packages/ai-workspace-common/stores/sider';
import { CanvasActionDropdown } from '@refly-packages/ai-workspace-common/components/workspace/canvas-list-modal/canvasActionDropdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

const { Text } = Typography;

interface AddCanvasDropdownProps {
  debouncedCreateCanvas: () => void;
  children?: React.ReactNode;
}
const AddCanvasDropdown = ({ debouncedCreateCanvas, children }: AddCanvasDropdownProps) => {
  const { t } = useTranslation();

  const items = [
    {
      key: 'createCanvas',
      label: t('project.action.createCanvas'),
      onClick: () => {
        debouncedCreateCanvas();
      },
    },
    {
      key: 'addExistingCanvas',
      label: t('project.action.addExistingCanvas'),
      onClick: () => {
        console.log('addExistingCanvas');
      },
    },
  ];

  return (
    <Dropdown menu={{ items }}>
      {children || (
        <Button
          type="default"
          size="small"
          className="text-xs text-gray-600"
          icon={<IconPlus size={12} className="flex items-center justify-center" />}
        >
          {t('project.action.addCanvas')}
        </Button>
      )}
    </Dropdown>
  );
};

export const CanvasMenu = ({
  canvasList,
  projectId,
  onUpdatedCanvasList,
}: { canvasList: SiderData[]; projectId: string; onUpdatedCanvasList?: () => void }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const canvasId = searchParams.get('canvasId');
  const navigate = useNavigate();
  const { debouncedCreateCanvas } = useCreateCanvas({
    projectId,
    afterCreateSuccess: onUpdatedCanvasList,
  });

  const [hoveredCanvasId, setHoveredCanvasId] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedCanvases, setSelectedCanvases] = useState<SiderData[]>([]);

  const handleCanvasHover = useCallback(
    (id: string | null) => {
      if (!isMultiSelectMode) {
        setHoveredCanvasId(id);
      }
    },
    [isMultiSelectMode],
  );

  const toggleSearchMode = useCallback(() => {
    setIsSearchMode((prev) => !prev);
    if (isSearchMode) {
      setSearchValue('');
    }
  }, [isSearchMode]);

  const filteredCanvasList = useMemo(() => {
    if (!searchValue) return canvasList;
    return canvasList.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()));
  }, [searchValue, canvasList]);

  const toggleCanvasSelection = useCallback((canvas: SiderData) => {
    setSelectedCanvases((prev) => {
      if (prev.some((item) => item.id === canvas.id)) {
        return prev.filter((item) => item.id !== canvas.id);
      }
      setIsMultiSelectMode(true);
      return [...prev, canvas];
    });
  }, []);

  const exitMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedCanvases([]);
    setHoveredCanvasId(null);
  }, []);

  const deleteSelectedCanvases = useCallback(() => {
    message.success(`已删除 ${selectedCanvases.length} 个画布`);
    exitMultiSelectMode();
  }, [selectedCanvases, exitMultiSelectMode]);

  const removeSelectedCanvasesFromProject = useCallback(async () => {
    const res = await getClient().updateProjectItems({
      body: {
        projectId,
        items: selectedCanvases.map((item) => ({
          entityType: 'canvas',
          entityId: item.id,
        })),
      },
    });
    const { data } = res || {};
    if (data?.success) {
      setSelectedCanvases([]);
      setHoveredCanvasId(null);
      message.success(t('project.action.removeItemsSuccess'));
      onUpdatedCanvasList?.();
    }
  }, [selectedCanvases, projectId, t, onUpdatedCanvasList]);

  const handleCanvasClick = useCallback(
    (canvasId: string, canvas: SiderData) => {
      if (isMultiSelectMode) {
        toggleCanvasSelection(canvas);
      } else {
        navigate(`/project/${projectId}?canvasId=${canvasId}`);
      }
    },
    [isMultiSelectMode, navigate, projectId, toggleCanvasSelection],
  );

  const headerActions = useMemo(() => {
    if (isSearchMode || isMultiSelectMode) {
      return (
        <>
          {isMultiSelectMode && (
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="text-xs text-gray-500">
                {t('project.sourceList.selectedCount', { count: selectedCanvases.length })}
              </div>
              <div className="flex items-center gap-2">
                <Popconfirm
                  title={t('project.sourceList.deleteConfirm')}
                  onConfirm={deleteSelectedCanvases}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<IconDelete className={cn(iconClassName, 'text-red-500')} />}
                  />
                </Popconfirm>

                <Popconfirm
                  title={t('project.sourceList.removeConfirm')}
                  onConfirm={removeSelectedCanvasesFromProject}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<IconRemove className={cn(iconClassName, 'text-gray-500')} />}
                  />
                </Popconfirm>
                <Button
                  type="text"
                  size="small"
                  icon={<IconClose className={cn(iconClassName, 'text-gray-500')} />}
                  onClick={exitMultiSelectMode}
                />
              </div>
            </div>
          )}

          {isSearchMode && (
            <div className="flex items-center gap-2 w-full justify-between mt-2">
              <Input
                autoFocus
                type="text"
                className="text-xs px-2 py-1 border border-gray-200 rounded-md flex-grow focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t('project.sourceList.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Button
                type="text"
                size="small"
                icon={<IconClose className={cn(iconClassName, 'text-gray-500')} />}
                onClick={toggleSearchMode}
              />
            </div>
          )}
        </>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <AddCanvasDropdown debouncedCreateCanvas={debouncedCreateCanvas}>
          <Button
            type="text"
            size="small"
            icon={<IconPlus className={cn(iconClassName, 'text-gray-500')} />}
          />
        </AddCanvasDropdown>
        <Button
          type="text"
          size="small"
          icon={<IconSearch className={cn(iconClassName, 'text-gray-500')} />}
          onClick={toggleSearchMode}
        />
      </div>
    );
  }, [
    isMultiSelectMode,
    isSearchMode,
    searchValue,
    selectedCanvases.length,
    deleteSelectedCanvases,
    exitMultiSelectMode,
    removeSelectedCanvasesFromProject,
    toggleSearchMode,
    debouncedCreateCanvas,
    t,
  ]);

  return (
    <Collapse
      defaultActiveKey={['canvas']}
      ghost
      expandIconPosition="end"
      className="bg-white custom-collapse"
      items={[
        {
          key: 'canvas',
          label: <span className="text-sm font-medium">{t('project.canvas')}</span>,
          children: (
            <div className="flex flex-col">
              <div
                className={`mb-2 px-3 ${
                  isMultiSelectMode || isSearchMode ? '' : 'flex justify-between items-center'
                }`}
              >
                <div className="text-[10px] text-gray-500">
                  {t('project.canvasCount', {
                    canvasCount: canvasList.length,
                  })}
                </div>

                {headerActions}
              </div>
              <div className="max-h-[20vh] overflow-y-auto px-3">
                <List
                  itemLayout="horizontal"
                  split={false}
                  dataSource={filteredCanvasList}
                  locale={{
                    emptyText: (
                      <Empty
                        className="text-xs my-2 "
                        image={null}
                        imageStyle={{
                          display: 'none',
                        }}
                        description={t('common.empty')}
                      >
                        <AddCanvasDropdown debouncedCreateCanvas={debouncedCreateCanvas} />
                      </Empty>
                    ),
                  }}
                  renderItem={(item) => (
                    <List.Item
                      className={cn(
                        '!py-2 !px-1 rounded-md hover:bg-gray-50 cursor-pointer',
                        canvasId === item.id ? 'bg-gray-50' : '',
                        selectedCanvases.some((canvas) => canvas.id === item.id) && 'bg-gray-50',
                      )}
                      onMouseEnter={() => handleCanvasHover(item.id)}
                      onMouseLeave={() => handleCanvasHover(null)}
                      onClick={() => handleCanvasClick(item.id, item)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <IconCanvas className={cn(iconClassName, 'text-gray-500')} />
                          <Text className="w-[120px] text-[13px] text-gray-700 truncate">
                            {item.name || t('common.untitled')}
                          </Text>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 transition-opacity duration-200',
                            isMultiSelectMode || hoveredCanvasId === item.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        >
                          <Checkbox
                            checked={selectedCanvases.some((canvas) => canvas.id === item.id)}
                            onChange={() => toggleCanvasSelection(item)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {!isMultiSelectMode && (
                            <CanvasActionDropdown canvasId={item.id} canvasName={item.name} />
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
};
