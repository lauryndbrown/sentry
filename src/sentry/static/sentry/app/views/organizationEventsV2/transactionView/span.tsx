import React from 'react';
import styled from 'react-emotion';
import {get} from 'lodash';

import {t} from 'app/locale';
import space from 'app/styles/space';
import Count from 'app/components/count';
import Tooltip from 'app/components/tooltip';

import {SPAN_ROW_HEIGHT, SpanRow} from './styles';
import {MINIMAP_CONTAINER_HEIGHT} from './minimap';

import {
  toPercent,
  SpanBoundsType,
  SpanGeneratedBoundsType,
  getHumanDuration,
  // rectOfElement,
  // rectRelativeTo,
  // rectOfViewport,
} from './utils';
import {SpanType} from './types';
import {DividerHandlerManagerChildrenProps} from './dividerHandlerManager';
import SpanDetail from './spanDetail';

type PropType = {
  span: Readonly<SpanType>;
  generateBounds: (bounds: SpanBoundsType) => SpanGeneratedBoundsType;
  treeDepth: number;
  numOfSpanChildren: number;
  renderedSpanChildren: Array<JSX.Element>;
  spanBarColour: string;
  spanNumber: number;

  dividerHandlerChildrenProps: DividerHandlerManagerChildrenProps;

  panMinimapVertically: (panYValue: number) => void;
};

type State = {
  displayDetail: boolean;
  showSpanTree: boolean;
};

const INTERSECTION_THRESHOLDS: Array<number> = [];

for (let i = 0; i <= 1.0; i += 0.01) {
  INTERSECTION_THRESHOLDS.push(i);
}

class Span extends React.Component<PropType, State> {
  state: State = {
    displayDetail: false,
    showSpanTree: true,
  };

  spanRowDOMRef = React.createRef<HTMLDivElement>();
  intersectionObserver?: IntersectionObserver = void 0;

  // TODO: remove this
  // resizeObserver?: any = void 0;

  toggleSpanTree = () => {
    this.setState(state => {
      return {
        showSpanTree: !state.showSpanTree,
      };
    });
  };

  toggleDisplayDetail = () => {
    this.setState(state => {
      return {
        displayDetail: !state.displayDetail,
      };
    });
  };

  renderDetail = ({isVisible}: {isVisible: boolean}) => {
    if (!this.state.displayDetail || !isVisible) {
      return null;
    }

    const {span} = this.props;

    return <SpanDetail span={span} />;
  };

  getBounds = () => {
    const {span, generateBounds} = this.props;

    return generateBounds({
      startTimestamp: span.start_timestamp,
      endTimestamp: span.timestamp,
    });
  };

  renderSpanTreeToggler = ({left}: {left: number}) => {
    const {numOfSpanChildren} = this.props;

    const chevron = this.state.showSpanTree ? <ChevronOpen /> : <ChevronClosed />;

    if (numOfSpanChildren <= 0) {
      return null;
    }

    return (
      <SpanTreeTogglerContainer style={{left: `${left}px`}}>
        <SpanTreeToggler
          isExpanded={this.state.showSpanTree}
          onClick={event => {
            event.stopPropagation();

            this.toggleSpanTree();
          }}
        >
          <span style={{marginRight: '2px', textAlign: 'center'}}>
            <Count value={numOfSpanChildren} />
          </span>
          <div style={{marginRight: '2px', width: '5px', textAlign: 'right'}}>
            {chevron}
          </div>
        </SpanTreeToggler>
      </SpanTreeTogglerContainer>
    );
  };

  renderTitle = ({warningText}: {warningText?: string} = {}) => {
    const {span, treeDepth} = this.props;

    const op = span.op ? <strong>{`${span.op} \u2014 `}</strong> : '';
    const description = get(span, 'description', span.span_id);

    const MARGIN_LEFT = 8;
    const TOGGLE_BUTTON_MARGIN_RIGHT = 8;
    const TOGGLE_BUTTON_MAX_WIDTH = 40;

    const left =
      treeDepth * (TOGGLE_BUTTON_MAX_WIDTH + TOGGLE_BUTTON_MARGIN_RIGHT) + MARGIN_LEFT;

    return (
      <SpanBarTitleContainer>
        {this.renderSpanTreeToggler({left})}
        <SpanBarTitle
          data-component="span-bar-title"
          style={{
            left: `${left}px`,
            width: '100%',
          }}
        >
          <span>
            {op}
            {description}
          </span>
          {warningText && (
            <Tooltip title={warningText}>
              <span style={{marginLeft: '8px', lineHeight: 0, height: '15px'}}>
                <WarningIcon />
              </span>
            </Tooltip>
          )}
        </SpanBarTitle>
      </SpanBarTitleContainer>
    );
  };

  renderSpanChildren = () => {
    if (!this.state.showSpanTree) {
      return null;
    }

    return this.props.renderedSpanChildren;
  };

  renderSpanRow = () => {
    const {span, spanBarColour} = this.props;

    const startTimestamp: number = span.start_timestamp;
    const endTimestamp: number = span.timestamp;

    const duration = Math.abs(endTimestamp - startTimestamp);

    const durationString = getHumanDuration(duration);

    const bounds = this.getBounds();

    const timestampStatus = parseSpanTimestamps(span);

    const isVisible =
      timestampStatus === TimestampStatus.Stable
        ? bounds.end > 0 && bounds.start < 1
        : true;

    const warningText =
      timestampStatus === TimestampStatus.Equal
        ? t('The start and end timestamps are equal')
        : timestampStatus === TimestampStatus.Reversed
        ? t('The start and end timestamps are reversed')
        : null;

    const spanLeft = timestampStatus === TimestampStatus.Stable ? bounds.start : 0;
    const spanWidth =
      timestampStatus === TimestampStatus.Stable ? bounds.end - bounds.start : 1;

    const {
      dividerPosition,
      dividerHandlePosition,
    } = this.props.dividerHandlerChildrenProps;

    const ghostDivider = this.props.dividerHandlerChildrenProps.isDragging ? (
      <DividerLine
        style={{
          left: toPercent(dividerPosition),
          // we would like to hide the divider line when the span details
          // has been expanded
          display: this.state.displayDetail ? 'none' : void 0,
        }}
        hovering={true}
      />
    ) : null;

    return (
      <SpanRow
        innerRef={this.spanRowDOMRef}
        data-span-number={String(this.props.spanNumber)}
        style={{
          display: isVisible ? 'block' : 'none',

          // TODO: this is a border-top; this needs polishing from a real CSS ninja
          boxShadow: this.state.displayDetail ? '0 -1px 0 #d1cad8' : void 0,
        }}
        onClick={() => {
          this.toggleDisplayDetail();
        }}
      >
        <SpanRowCellContainer>
          <SpanRowCell
            style={{
              left: 0,
              width: toPercent(dividerPosition),
              backgroundColor: this.state.displayDetail ? '#F0ECF3' : void 0,
            }}
          >
            {this.renderTitle({warningText})}
          </SpanRowCell>
          <SpanRowCell
            style={{
              left: toPercent(dividerPosition),
              width: toPercent(1 - dividerPosition),
              backgroundColor: this.state.displayDetail ? '#F0ECF3' : void 0,
            }}
          >
            <SpanBar
              data-span="true"
              style={{
                backgroundColor: spanBarColour,
                left: toPercent(spanLeft),
                width: toPercent(spanWidth),
              }}
            />
            <Duration>{durationString}</Duration>
          </SpanRowCell>
          {ghostDivider}
          <DividerLine
            style={{
              left: toPercent(dividerHandlePosition),
              backgroundColor: this.props.dividerHandlerChildrenProps.isDragging
                ? 'rgba(73,80,87,0.75)'
                : void 0,
              // we would like to hide the divider line when the span details
              // has been expanded
              display: this.state.displayDetail ? 'none' : undefined,
            }}
            hovering={
              this.props.dividerHandlerChildrenProps.dividerHandleHovering ||
              this.props.dividerHandlerChildrenProps.isDragging
            }
            onMouseEnter={() => {
              this.props.dividerHandlerChildrenProps.setHover(true);
            }}
            onMouseLeave={() => {
              this.props.dividerHandlerChildrenProps.setHover(false);
            }}
            onMouseDown={this.props.dividerHandlerChildrenProps.onDragStart}
            onClick={event => {
              event.stopPropagation();
            }}
          />
        </SpanRowCellContainer>

        {this.renderDetail({isVisible})}
      </SpanRow>
    );
  };

  connectObserver = () => {
    if (!this.spanRowDOMRef.current) {
      return;
    }

    this.disconnectObserver();

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const spanNumberRaw = entry.target.getAttribute('data-span-number');

          if (typeof spanNumberRaw !== 'string') {
            return;
          }

          const spanNumber = Number(spanNumberRaw);

          if (!isFinite(spanNumber)) {
            return;
          }

          // console.log('entry', entry, entry.target);

          // root refers to the root intersection rectangle used for the IntersectionObserver
          const rectRelativeToRoot = entry.boundingClientRect as DOMRect;

          const bottomYCoord = rectRelativeToRoot.y + rectRelativeToRoot.height;

          // refers to if the rect is out of view from the viewport
          const isOutOfViewAbove = rectRelativeToRoot.y < 0 && bottomYCoord < 0;

          if (isOutOfViewAbove) {
            return;
          }

          const relativeToMinimap = {
            top: rectRelativeToRoot.y - MINIMAP_CONTAINER_HEIGHT,
            bottom: bottomYCoord - MINIMAP_CONTAINER_HEIGHT,
          };

          const rectBelowMinimap =
            relativeToMinimap.top > 0 && relativeToMinimap.bottom > 0;

          const inAndAboveMinimap = relativeToMinimap.bottom <= 0;

          if (rectBelowMinimap || inAndAboveMinimap) {
            return;
          }

          // TODO: move this
          const MINIMAP_SPAN_BAR_HEIGHT = 5;

          // invariant: spanNumber >= 1

          const numberOfMovedSpans = spanNumber - 1;
          const totalHeightOfHiddenSpans = numberOfMovedSpans * MINIMAP_SPAN_BAR_HEIGHT;
          const currentSpanHiddenRatio = 1 - entry.intersectionRatio;

          const panYPixels =
            totalHeightOfHiddenSpans + currentSpanHiddenRatio * MINIMAP_SPAN_BAR_HEIGHT;

          this.props.panMinimapVertically(panYPixels);
        });
      },
      {
        threshold: INTERSECTION_THRESHOLDS,
        rootMargin: `-${MINIMAP_CONTAINER_HEIGHT}px 0px 0px 0px`,
      }
    );

    this.intersectionObserver.observe(this.spanRowDOMRef.current);
  };

  disconnectObserver = () => {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  };

  componentDidMount() {
    if (this.spanRowDOMRef.current) {
      this.connectObserver();

      // TODO: remove this
      // this.resizeObserver = new (window as any).ResizeObserver(() => {
      //   console.log('resized');
      //   this.connectObserver();
      // });

      // this.resizeObserver.observe(this.spanRowDOMRef.current);
    }
  }

  componentWillUnmount() {
    this.disconnectObserver();

    // TODO: remove this
    // if (this.resizeObserver) {
    //   this.resizeObserver.disconnect();
    // }
  }

  render() {
    return (
      <React.Fragment>
        {this.renderSpanRow()}
        {this.renderSpanChildren()}
      </React.Fragment>
    );
  }
}

enum TimestampStatus {
  Stable,
  Reversed,
  Equal,
}

const parseSpanTimestamps = (span: SpanType): TimestampStatus => {
  const startTimestamp: number = span.start_timestamp;
  const endTimestamp: number = span.timestamp;

  if (startTimestamp < endTimestamp) {
    return TimestampStatus.Stable;
  }

  if (startTimestamp === endTimestamp) {
    return TimestampStatus.Equal;
  }

  return TimestampStatus.Reversed;
};

const SpanRowCellContainer = styled('div')`
  position: relative;
  height: ${SPAN_ROW_HEIGHT}px;
`;

const SpanRowCell = styled('div')`
  position: absolute;

  height: ${SPAN_ROW_HEIGHT}px;

  overflow: hidden;
`;

export const DividerLine = styled('div')`
  position: absolute;
  height: ${SPAN_ROW_HEIGHT}px;

  width: 2px;
  transform: translateX(-50%);

  background-color: #cdc7d5;
  z-index: 999999;

  &:hover {
    width: 4px;

    cursor: col-resize;
  }

  ${({hovering}: {hovering: boolean}) => {
    if (!hovering) {
      return null;
    }

    return `
      width: 4px;
      transform: translateX(-50%);

      cursor: col-resize;
      `;
  }}
`;

const SpanBarTitleContainer = styled('div')`
  display: flex;
  align-items: center;

  height: ${SPAN_ROW_HEIGHT}px;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
`;

const SpanBarTitle = styled('div')`
  position: relative;
  top: 0;

  height: ${SPAN_ROW_HEIGHT}px;
  line-height: ${SPAN_ROW_HEIGHT}px;

  color: #4a3e56;
  font-size: 12px;

  user-select: none;

  white-space: nowrap;

  display: flex;
  align-items: center;
`;

const SpanTreeTogglerContainer = styled('div')`
  position: relative;
  top: 0;

  height: 15px;

  max-width: 40px;
  width: 40px;
  min-width: 40px;

  margin-right: 8px;

  z-index: 99999;

  user-select: none;

  display: flex;
  justify-content: flex-end;
`;

const SpanTreeToggler = styled('div')`
  position: relative;

  white-space: nowrap;

  height: 15px;
  min-width: 25px;

  padding-left: 4px;
  padding-right: 4px;

  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  align-content: center;
  justify-content: center;

  > span {
    flex-grow: 999;
  }

  transition: all 0.15s ease-in-out;

  border-radius: 99px;

  ${({isExpanded}: {isExpanded: boolean}) => {
    if (!isExpanded) {
      return `
      background: #6e5f7d;
      border: 1px solid #452650;
      color: #ffffff;
      & svg path {
        stroke: #ffffff;
      }

      &:hover {
        background: #fbfaf9;
        border: 1px solid #6e5f7d;
        color: #6e5f7d;
        & svg path {
          stroke: #452650;
        }
      }
      `;
    }

    return `
      background: #fbfaf9;
      border: 1px solid #6e5f7d;
      color: #6e5f7d;

      &:hover {
        background: #6e5f7d;
        border: 1px solid #452650;
        color: #ffffff;
        & svg path {
          stroke: #ffffff;
        }
      }
    `;
  }};

  font-size: 9px;
  line-height: 0;
`;

const Duration = styled('div')`
  position: absolute;
  right: 0;
  top: 0;
  height: ${SPAN_ROW_HEIGHT}px;
  line-height: ${SPAN_ROW_HEIGHT}px;

  color: #9585a3;
  font-size: 12px;
  padding-right: ${space(1)};

  user-select: none;
`;

const SpanBar = styled('div')`
  position: relative;
  min-height: ${SPAN_ROW_HEIGHT - 4}px;
  height: ${SPAN_ROW_HEIGHT - 4}px;
  max-height: ${SPAN_ROW_HEIGHT - 4}px;

  margin-top: 2px;
  margin-bottom: 2px;
  border-radius: 3px;

  overflow: hidden;

  user-select: none;

  padding: 4px;

  transition: border-color 0.15s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0);
`;

const ChevronOpen = props => (
  <svg width={5} height={4} fill="none" {...props}>
    <path
      d="M.5 1.25l2 2 2-2"
      stroke="#6E5F7D"
      strokeWidth={0.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronClosed = props => (
  <svg width={3} height={6} fill="none" {...props}>
    <path
      d="M.5 5.25l2-2-2-2"
      stroke="#6E5F7D"
      strokeWidth={0.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WarningIcon = props => (
  <svg width={15} height={15} fill="none" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.012 4.463v3.825a.638.638 0 001.275 0V4.463a.637.637 0 10-1.275 0zM7.65 10.2a.637.637 0 100 1.275.637.637 0 000-1.275z"
      fill="#493A05"
    />
    <rect x={0.5} y={0.5} width={14} height={14} rx={7} stroke="#493A05" />
  </svg>
);

export default Span;
