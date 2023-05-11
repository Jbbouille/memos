import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/store/module";
import Icon from "./Icon";
import "@/less/memo-content.less";
import { renderMarkdown } from "@/labs/render";
import mermaid from "mermaid";

const MAX_EXPAND_HEIGHT = 384;

interface Props {
  content: string;
  className?: string;
  showFull?: boolean;
  onMemoContentClick?: (e: React.MouseEvent) => void;
  onMemoContentDoubleClick?: (e: React.MouseEvent) => void;
  onMemoCodeClick?: (e: React.MouseEvent) => boolean;
}

type ExpandButtonStatus = -1 | 0 | 1;

interface State {
  expandButtonStatus: ExpandButtonStatus;
}

const MemoContent: React.FC<Props> = (props: Props) => {
  const { className, content, showFull, onMemoContentClick, onMemoContentDoubleClick, onMemoCodeClick } = props;
  const { t } = useTranslation();

  const [state, setState] = useState<State>({
    expandButtonStatus: -1,
  });
  const memoContentContainerRef = useRef<HTMLDivElement>(null);

  //variable for auto-collapse
  const userStore = useUserStore();
  const isVisitorMode = userStore.isVisitorMode();
  const autoCollapse: boolean = isVisitorMode ? true : (userStore.state.user as User).localSetting.enableAutoCollapse;

  useEffect(() => {
    if (showFull) {
      return;
    }

    if (memoContentContainerRef.current) {
      const height = memoContentContainerRef.current.clientHeight;
      if (height > MAX_EXPAND_HEIGHT) {
        setState({
          expandButtonStatus: 0,
        });
      }
    }
  }, []);

  const handleMemoContentClick = async (e: React.MouseEvent) => {
    if (onMemoCodeClick && onMemoCodeClick(e)) {
      return;
    }
    if (onMemoContentClick) {
      onMemoContentClick(e);
    }
  };

  const handleMemoContentDoubleClick = async (e: React.MouseEvent) => {
    if (onMemoCodeClick && onMemoCodeClick(e)) {
      return;
    }
    if (onMemoContentDoubleClick) {
      onMemoContentDoubleClick(e);
    }
  };

  const handleExpandBtnClick = () => {
    const expandButtonStatus = Boolean(!state.expandButtonStatus);
    setState({
      expandButtonStatus: Number(expandButtonStatus) as ExpandButtonStatus,
    });
  };

  useEffect(() => {
    const mermaidElement = memoContentContainerRef?.current?.querySelector("code.language-mermaid");
    if (mermaidElement) {
      mermaid.run({ nodes: [mermaidElement as HTMLElement] }).catch((e) => console.error(e));
    }
  }, [content]);

  return (
    <div className={`memo-content-wrapper ${className || ""}`}>
      <div
        ref={memoContentContainerRef}
        className={`memo-content-text ${autoCollapse && state.expandButtonStatus === 0 ? "max-h-64 overflow-y-hidden" : ""}`}
        onClick={handleMemoContentClick}
        onDoubleClick={handleMemoContentDoubleClick}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      ></div>
      {autoCollapse && state.expandButtonStatus !== -1 && (
        <div className={`expand-btn-container ${state.expandButtonStatus === 0 && "!-mt-7"}`}>
          <div className="absolute top-0 left-0 w-full h-full blur-lg bg-white dark:bg-zinc-700"></div>
          <span className={`btn z-10 ${state.expandButtonStatus === 0 ? "expand-btn" : "fold-btn"}`} onClick={handleExpandBtnClick}>
            {state.expandButtonStatus === 0 ? t("common.expand") : t("common.fold")}
            <Icon.ChevronRight className="icon-img opacity-80" />
          </span>
        </div>
      )}
    </div>
  );
};

export default MemoContent;
