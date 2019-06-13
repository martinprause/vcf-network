import { html, PolymerElement } from '@polymer/polymer/polymer-element';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin';
import { colorVars } from '../util/vcf-network-colors';
import '@vaadin/vaadin-button';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-select';
import './vcf-network-color-option';

class VcfNetworkInfoPanel extends ThemableMixin(PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          width: 240px;
        }

        .panel-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        span.selection {
          align-items: center;
          box-shadow: inset 0 -1px 0 0 var(--lumo-shade-10pct);
          color: var(--lumo-tertiary-text-color);
          display: flex;
          flex-shrink: 0;
          font-size: var(--lumo-font-size-s);
          font-weight: 500;
          height: var(--lumo-size-l);
          padding: 0 var(--lumo-space-m);
        }

        span.selection.active {
          background-color: var(--lumo-primary-color-10pct);
          color: var(--lumo-primary-text-color);
        }

        .button-container {
          align-items: center;
          box-shadow: inset 0 -1px 0 0 var(--lumo-shade-10pct);
          display: flex;
          flex-shrink: 0;
          height: var(--lumo-size-xl);
        }

        .button-container vaadin-button {
          width: calc(100% / 4);
        }

        .details-container {
          flex-grow: 1;
          overflow: auto;
          padding: 0 var(--lumo-space-m) var(--lumo-space-m) var(--lumo-space-m);
        }

        .details {
          display: flex;
          flex-direction: column;
          opacity: 1;
          transition: all 0.2s;
        }

        .details.hidden {
          display: none;
          opacity: 0;
          transition: all 0.2s;
        }
      </style>
      <div id="main" class="panel-container">
        <span id="selection" class="selection">[[selectionText]]</span>
        <div class="button-container">
          <vaadin-button id="create-component-button" theme="tertiary" title="Create component">
            <iron-icon icon="icons:cached"></iron-icon>
          </vaadin-button>
          <vaadin-button id="export-button" theme="tertiary" title="Export component">
            <iron-icon icon="icons:swap-vert"></iron-icon>
          </vaadin-button>
          <vaadin-button id="copy-button" theme="tertiary" title="Copy">
            <iron-icon icon="icons:content-copy"></iron-icon>
          </vaadin-button>
          <vaadin-button id="delete-button" theme="tertiary error" title="Delete">
            <iron-icon icon="icons:delete"></iron-icon>
          </vaadin-button>
        </div>
        <div class="details-container">
          <div class="details hidden" id="node-details">
            <vaadin-text-field id="node-name" label="Name" theme="small"></vaadin-text-field>
            <vaadin-text-field
              id="node-id"
              label="ID"
              readonly
              autoselect
              theme="small"
            ></vaadin-text-field>
          </div>
          <div class="details hidden" id="edge-details">
            <vaadin-text-field
              id="edge-id"
              label="Id"
              readonly
              autoselect
              theme="small"
            ></vaadin-text-field>
            <vaadin-text-field
              id="edge-from"
              label="From"
              readonly
              autoselect
              theme="small"
            ></vaadin-text-field>
            <vaadin-text-field
              id="edge-to"
              label="To"
              readonly
              autoselect
              theme="small"
            ></vaadin-text-field>
          </div>
          <div class="details hidden" id="component-details">
            <vaadin-text-field id="component-name" label="Name" theme="small"></vaadin-text-field>
            <vaadin-text-field
              id="component-id"
              label="ID"
              readonly
              autoselect
              theme="small"
            ></vaadin-text-field>
            <vaadin-select id="component-color" label="Color">
              <template>
                <vaadin-list-box>
                  <template is="dom-repeat" items="[[_colors]]">
                    <vaadin-item>
                      <vcf-network-color-option color="[[index]]"></vcf-network-color-option>
                    </vaadin-item>
                  </template>
                </vaadin-list-box>
              </template>
            </vaadin-select>
          </div>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'vcf-network-info-panel';
  }

  static get properties() {
    return {
      selection: {
        type: Object,
        observer: '_selectionChanged'
      },
      selectionText: {
        type: String,
        value: 'No selection'
      },
      _colors: {
        type: Array,
        value: () => colorVars
      }
    };
  }

  get componentLabel() {
    if (!this._componentCount) {
      this._componentCount = 0;
    }
    return `Component ${++this._componentCount}`;
  }

  connectedCallback() {
    super.connectedCallback();
    this._initEventListeners();
  }

  _initEventListeners() {
    this.$['node-name'].addEventListener('change', this._updateNode('label'));
    this.$['create-component-button'].addEventListener('click', () => this._addComponent());
    this.$['export-button'].addEventListener('click', () => this._exportComponent());
  }

  _selectionChanged(selection) {
    this._setSelectionText();

    // @nii please do your magic here :)
    if (this.selectionText === 'No selection') {
      this.$['selection'].classList.remove('active');
    } else {
      this.$['selection'].classList.add('active');
    }

    this.$['node-details'].classList.add('hidden');
    this.$['edge-details'].classList.add('hidden');
    this.$['component-details'].classList.add('hidden');
    if (selection.nodes.length === 1 && !selection.edges.length) {
      this._selectedNode = this._parent._network.body.nodes[selection.nodes[0]];
      this.$['node-name'].value = this._selectedNode.options.label;
      this.$['node-id'].value = this._selectedNode.id;
      this.$['node-id'].title = this._selectedNode.id;
      this.$['node-details'].classList.remove('hidden');
    } else if (selection.edges.length === 1 && !selection.nodes.length) {
      this._selectedEdge = this._parent._network.body.edges[selection.edges[0]];
      this.$['edge-id'].value = this._selectedEdge.id;
      this.$['edge-from'].value = this._selectedEdge.options.from;
      this.$['edge-to'].value = this._selectedEdge.options.to;
      this.$['edge-details'].classList.remove('hidden');
    }
  }

  _setSelectionText() {
    let selectionText = '';
    if (this.selection) {
      const nodeCount = this.selection.nodes.length;
      const edgeCount = this.selection.edges.length;
      if (nodeCount) {
        selectionText = nodeCount === 1 ? '1 node' : `${nodeCount} nodes`;
      }
      if (edgeCount) {
        selectionText += selectionText && ', ';
        selectionText += edgeCount === 1 ? '1 edge' : `${edgeCount} edges`;
      }
      selectionText += selectionText && ' selected';
    }
    this.selectionText = selectionText || 'No selection';
  }

  _exportComponent() {
    let templateId = 0;
    const templateIdMap = {};
    const obj = {
      nodes: this.selection.nodes.map(id => {
        const node = this._parent.data.nodes.get(id);
        templateIdMap[id] = templateId++;
        return {
          ...node,
          id: templateIdMap[id]
        };
      }),
      edges: this.selection.edges.map(id => {
        const edge = this._parent.data.edges.get(id);
        templateIdMap[id] = templateId++;
        return {
          ...edge,
          from: templateIdMap[edge.from],
          to: templateIdMap[edge.to],
          id: templateIdMap[id]
        };
      })
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj));
    const download = document.createElement('a');
    download.setAttribute('href', dataStr);
    download.setAttribute('download', 'component.json');
    download.click();
  }

  _addComponent() {
    /* Create component node */
    const nodeIds = this.selection.nodes;
    const posNode = this._parent.data.nodes.get(nodeIds[0]);
    const component = {
      label: this.componentLabel,
      id: vis.util.randomUUID(),
      x: posNode.x,
      y: posNode.y,
      cid: `component:${vis.util.randomUUID()}`,
      nodes: this._getSelectedNodes(),
      edges: this._getConnectedEdges(nodeIds)
    };
    const externalEdges = component.edges.filter(edge => {
      const isExternal = !nodeIds.includes(edge.to) || !nodeIds.includes(edge.from);
      if (isExternal) {
        component.edges.splice(component.edges.indexOf(edge.id), 1);
      }
      return isExternal;
    });
    this._parent.data.components.push(component);
    /* Update nodes */
    this._parent.data.nodes.remove(nodeIds);
    this._parent.data.nodes.add(component);
    /* Update edges */
    this._parent.data.edges.remove(component.edges);
    externalEdges.forEach(edge => {
      if (nodeIds.includes(edge.from)) {
        edge.from = component.id;
      }
      if (nodeIds.includes(edge.to)) {
        edge.to = component.id;
      }
      this._parent.data.edges.update(edge);
    });
  }

  _updateNode(property) {
    return e => {
      this._parent.data.nodes.update({
        id: this._selectedNode.id,
        [property]: e.target.value
      });
    };
  }

  _getSelectedNodes() {
    return this.selection.nodes.map(id => this._parent.data.nodes.get(id));
  }

  _getConnectedEdges(nodeIds) {
    /* create set of unique connected egde ids */
    const edgeIdSet = new Set();
    nodeIds.forEach(node => {
      this._parent._network.getConnectedEdges(node).forEach(edge => {
        edgeIdSet.add(edge);
      });
    });
    /* create array of edge objects from set */
    const edges = [...edgeIdSet].map(id => this._parent.data.edges.get(id));
    return edges;
  }
}

customElements.define(VcfNetworkInfoPanel.is, VcfNetworkInfoPanel);