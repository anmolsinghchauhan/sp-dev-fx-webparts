import * as _ from "lodash";
import { DefaultButton, PrimaryButton } from "office-ui-fabric-react/lib/Button";
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import { IContextualMenuItem, } from "office-ui-fabric-react/lib/ContextualMenu";
import {
  CheckboxVisibility,
  DetailsList, DetailsListLayoutMode, IColumn, SelectionMode,
} from "office-ui-fabric-react/lib/DetailsList";
import { Dialog, DialogType } from "office-ui-fabric-react/lib/Dialog";
import { Label } from "office-ui-fabric-react/lib/Label";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { Toggle } from "office-ui-fabric-react/lib/Toggle";
import * as React from "react";
import { Web } from "sp-pnp-js";
import DisplayProp from "../../shared/DisplayProp";
import utils from "../../shared/utils";
import { IPropertyBagEditorProps } from "./IPropertyBagEditorProps";
require("sp-init");
require("microsoft-ajax");
require("sp-runtime");
require("sharepoint");

export interface IPropertyBagEditorState {
  displayProps: Array<DisplayProp>; // The list of properties displayed in the webpart
  workingStorage?: DisplayProp; // a working copy of the property currently being edited
  selectedIndex: number; // the index of the currently selected propety
  searchableProps: Array<string>; // an array of all the searchable properties in the site
  messsage: string; // an error message
  isediting: boolean; // whether the webart is in enit mode
}
export default class PropertyBagEditor extends React.Component<IPropertyBagEditorProps, IPropertyBagEditorState> {
  public refs: {
    [key: string]: React.ReactInstance;
    list: any //DetailsList
  };
  public constructor(props: IPropertyBagEditorProps) {
    super(props);
    this.state = { searchableProps: [], displayProps: [], selectedIndex: -1, messsage: "", isediting: false };
  }
  /**Accessors */
  /**
   *  Get's the commands to be displayed in the CommandBar. There is only one command (Edit).
   *  If no item is selected the command is disabled
   * 
   * @readonly
   * @type {Array<IContextualMenuItem>}
   * @memberOf PropertyBagEditor
   */

  get CommandItems(): Array<IContextualMenuItem> {

    return [
      {
        key: "a",
        name: "Edit",
        disabled: !(this.ItemIsSelected),
        title: "Edit",
        onClick: this.onEditItemClicked.bind(this),
        icon: "Edit"
      }];
  };

  /**
   *  Determines if an item is selected.
   * 
   * @readonly
   * @type {boolean}
   * @memberOf PropertyBagEditor
   */
  get ItemIsSelected(): boolean {
    if (!this.state) { return false; }
    return (this.state.selectedIndex != -1);
  }

  /** react lifecycle */
  public componentWillMount() {

    const web = new Web(this.props.siteUrl);
    web.select("Title", "AllProperties").expand("AllProperties").get().then(r => {
      debugger;
      const sp = utils.decodeSearchableProps(r.AllProperties.vti_x005f_indexedpropertykeys);
      const dp = utils.SelectProperties(r.AllProperties, this.props.propertiesToEdit, sp);
      // this.state.searchableProps = sp;
      // this.state.displayProps = dp;

      this.setState((current) => ({ ...current, searchableProps: sp, displayProps: dp }))


    });
  }

  /** event hadlers */
  public stopediting() {
    //this.state.isediting = false;
    this.setState((current) => ({ ...current, isediting: false }))
  }
  public onActiveItemChanged(item?: any, index?: number) {
    //this.state.selectedIndex = index;
    this.setState((current) => ({ ...current, selectedIndex: index }))
  }
  /**
   *  Gets fired when the user changes the 'Searchable' value in the ui.
   *  Saves the value in workingStorage
   * 
   * @param {boolean} newValue 
   * 
   * @memberOf PropertyBagEditor
   */
  public onSearchableValueChanged(e: Event, newValue: boolean) {

    //this.state.workingStorage.searchable = newValue;
    //this.setState(this.state);
    //this.state.workingStorage.searchable = newValue;
    debugger;
    this.setState((current) => ({ ...current, workingStorage: ({ ...current.workingStorage, searchable: newValue }) }));
  }
  /**
   * Gets fired when the user changes the proprty value in the ui
   * Saves the value in workingStorage
   * 
   * @param {any} event 
   * 
   * @memberOf PropertyBagEditor
   */
  public onPropertyValueChanged(event) {
    debugger;
    //this.state.workingStorage.value = event.target.value;
    this.setState((current) => ({
      ...current,
      workingStorage: ({
        ...current.workingStorage,
        value: event.target.value
      })
    }
    ));
  }

  /**
   * Copies the selected item into workingStorage and sets the webpart into edit mode.
   * 
   * @param {MouseEvent} [e] 
   * 
   * @memberOf PropertyBagEditor
   */
  public onEditItemClicked(e?: MouseEvent): void {
    //this.state.isediting = true;
    //this.state.workingStorage = _.clone(this.state.displayProps[this.state.selectedIndex]);
    //this.setState(this.state);
    this.setState((current) => ({ ...current, isediting: true, workingStorage: _.clone(current.displayProps[current.selectedIndex]) }))
  }
  /**
   * Saves the item in workingStorage back to sharepoint, then clears workingStorage and stops editing.
   * 
   * @param {MouseEvent} [e] 
   * 
   * @memberOf PropertyBagEditor
   */
  public onSave(e?: MouseEvent): void {
    debugger;
    utils.setSPProperty(this.state.workingStorage.crawledPropertyName, this.state.workingStorage.value, this.props.siteUrl)
      .then(value => {
        this.changeSearchable(this.state.workingStorage.crawledPropertyName, this.state.workingStorage.searchable)
          .then(s => {
            //this.state.displayProps[this.state.selectedIndex] = this.state.workingStorage;
            const temp = _.clone(this.state.displayProps);// this.state.workingStorage = null;
            temp[this.state.selectedIndex] = this.state.workingStorage;// this.state.isediting = false;
            // this.setState(this.state);
            this.setState((current) => ({ ...current, isediting: false, workingStorage: null, displayProps: temp }))
          });
      });
  }
  /**
   * Clears workingStorage and stops editing
   * 
   * @param {MouseEvent} [e] 
   * 
   * @memberOf PropertyBagEditor
   */
  public onCancel(e?: MouseEvent): void {
    // this.state.isediting = false;
    // this.state.workingStorage = null;
    // this.setState(this.state);
    this.setState((current) => ({ ...current, isediting: false, workingStorage: null }))
  }


  /**
   * Makes a propety Searchable or non-Searchable in the sharepoint site
   * 
   * @param {string} propname The property to be made Searchable or non-Searchable 
   * @param {boolean} newValue Whether to make it Searchable or non-Searchable 
   * @returns {Promise<any>} 
   * 
   * @memberOf PropertyBagEditor
   */
  public changeSearchable(propname: string, newValue: boolean): Promise<any> {
    if (newValue) {//make prop searchable
      if (_.indexOf(this.state.searchableProps, propname) === -1) {// wasa not searchable, mpw it is
        //this.state.searchableProps.push(propname);
        const temp = _.clone(this.state.searchableProps);
        temp.push(propname);
        this.setState(current => ({ ...current, searchableProps: temp }));
        return utils.saveSearchablePropertiesToSharePoint(this.props.siteUrl, temp);
      }
      else {
        return Promise.resolve();
      }
    }
    else { // make prop not searchablke
      if (_.indexOf(this.state.searchableProps, propname) !== -1) {// wasa not searchable, mpw it is
        const temp = _.clone(this.state.searchableProps);

        _.remove(temp, p => { return p === propname; });
        this.setState(current => ({ ...current, searchableProps: temp }));
        return utils.saveSearchablePropertiesToSharePoint(this.props.siteUrl, temp);
      }
      else {
        return Promise.resolve();
      }
    }
  }
  private RenderBoolean(item?: any, index?: number, column?: IColumn): any {
    if (item[column.fieldName]) {
      return (<div>Yes</div>);
    } else {
      return (<div>No</div>);
    }
  }
  /**
   * Renders the webpart
   * 
   * @returns {React.ReactElement<IPropertyBagEditorProps>} 
   * 
   * @memberOf PropertyBagEditor
   */
  public render(): React.ReactElement<IPropertyBagEditorProps> {
    const columns: Array<IColumn> = [
      { isResizable: true, key: "name", name: "Propert Name", fieldName: "crawledPropertyName", minWidth: 150 },
      { isResizable: true, key: "value", name: "Propert Value", fieldName: "value", minWidth: 150 },
      { key: "searchable", name: "searchable", fieldName: "searchable", minWidth: 150, onRender: this.RenderBoolean },
    ];
    debugger;
    return (
      <div>
        <CommandBar items={this.CommandItems} />
        <DetailsList layoutMode={DetailsListLayoutMode.fixedColumns}
          columns={columns}
          selectionMode={SelectionMode.single}
          checkboxVisibility={CheckboxVisibility.hidden}
          items={this.state.displayProps}
          onActiveItemChanged={this.onActiveItemChanged.bind(this)}
        >
        </DetailsList>
        <Dialog
          hidden={!this.state.isediting} type={DialogType.close}
          onDismiss={this.stopediting.bind(this)}
          title={(this.state.workingStorage) ? this.state.workingStorage.crawledPropertyName : ""}        >

          <span> <Label>Site Url</Label> {this.props.siteUrl}</span>

          <TextField
            value={(this.state.workingStorage) ? this.state.workingStorage.value : ""}
            onChange={this.onPropertyValueChanged.bind(this)}
          />



          <Toggle label="Searchable"
            checked={(this.state.workingStorage) ? this.state.workingStorage.searchable : undefined}
            onChange={this.onSearchableValueChanged.bind(this)}
          />


          <DefaultButton default={true} iconProps={{ iconName: "Save" }} value="Save" onClick={this.onSave.bind(this)} >Save</DefaultButton>
          <PrimaryButton iconProps={{ iconName: "Cancel" }} value="Cancel" onClick={this.onCancel.bind(this)} >Cancel</PrimaryButton>


        </Dialog>
      </div>
    );
  }
}
