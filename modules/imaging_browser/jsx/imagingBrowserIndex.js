import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Tabs, TabPane} from 'Tabs';
import Loader from 'Loader';
import FilterableDataTable from 'FilterableDataTable';

class ImagingBrowserIndex extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: {},
            error: false,
            isLoaded: false,
        };

        this.fetchData = this.fetchData.bind(this);
        this.formatColumn = this.formatColumn.bind(this);
    }

    componentDidMount() {
        this.fetchData()
            .then(() => this.setState({isLoaded: true}));
    }

    /**
     * Retrieve data from the provided URL and save it in state
     * Additionally add hiddenHeaders to global loris variable
     * for easy access by columnFormatter.
     *
     * @return {object}
     */
    fetchData() {
        return fetch(this.props.dataURL, {credentials: 'same-origin'})
            .then((resp) => resp.json())
            .then((data) => this.setState({data}))
            .catch((error) => {
                this.setState({error: true});
                console.error(error);
            });
    }

    /**
     * Modify behaviour of specified column cells in the Data Table component
     *
     * @param {string} column - column name
     * @param {string} cell - cell content
     * @param {object} row - row content indexed by column
     *
     * @return {*} a formated table cell for a given column
     */
    formatColumn(column, cell, row) {
        // Set class to 'bg-danger' if file is hidden.
        const style = (row['File Visibility'] === '1') ? 'bg-danger' : '';
        let result = <td className={style}>{cell}</td>;
        switch (column) {
            case 'New Data':
                if (cell === 'new') {
                    result = (
                        <td className="newdata">
                            NEW
                        </td>
                    );
                }
                break;
            case 'Links':
                let cellTypes = cell.split(',');
                let cellLinks = [];
                for (let i = 0; i < cellTypes.length; i += 1) {
                    cellLinks.push(<a key={i} href={loris.BaseURL +
                    '/imaging_browser/viewSession/?sessionID=' +
                    row.SessionID + '&outputType=' +
                    cellTypes[i] + '&backURL=/imaging_browser/'}>
                        {cellTypes[i]}
                    </a>);
                    cellLinks.push(' | ');
                }
                cellLinks.push(<a key="selected" href={loris.BaseURL +
                '/imaging_browser/viewSession/?sessionID=' +
                row.SessionID +
                '&selectedOnly=1&backURL=/imaging_browser/'}>
                    selected
                </a>);

                cellLinks.push(' | ');
                cellLinks.push(<a key="all" href={loris.BaseURL +
                '/imaging_browser/viewSession/?sessionID=' +
                row.SessionID +
                '&backURL=/imaging_browser/'}>
                    all types
                </a>);
                result = (<td>{cellLinks}</td>);
                break;
        }

        return result;
    }

    render() {
        // If error occurs, return a message.
        // XXX: Replace this with a UI component for 500 errors.
        if (this.state.error) {
            return <h3>An error occured while loading the page.</h3>;
        }

        // Waiting for async data to load
        if (!this.state.isLoaded) {
            return <Loader/>;
        }

        /**
         * Currently, the order of these fields MUST match the order of the
         * queried columns in _setupVariables() in imaging_browser.class.inc
         */
        const options = this.state.data.fieldOptions;
        const configLabels = options.configLabels;
        const fields = [
            {label: 'Site', show: true, filter: {
                    name: 'site',
                    type: 'select',
                    options: options.sites,
                }},
            {label: 'PSCID', show: true, filter: {
                    name: 'PSCID',
                    type: 'text',
                }},
            {label: 'DCCID', show: true, filter: {
                    name: 'DCCID',
                    type: 'text',
                }},
            {label: 'Project', show: true, filter: {
                    name: 'project',
                    type: 'select',
                    options: options.projects,
                }},
            {label: 'Vist Label', show: true, filter: {
                    name: 'visitLabel',
                    type: 'text',
        }},
            {label: 'Visit QC Status', show: true, filter: {
                    name: 'visitQCStatus',
                    type: 'select',
                    options: options.visitQCStatus,
                }},
            {label: 'First Acquisition', show: true},
            {label: 'First Insertion', show: true},
            {label: 'Last QC', show: true},
            {label: 'New Data', show: true},
            {label: 'Links', show: true},
            {label: 'SessionID', show: false},
            {label: 'Sequence Type', show: false, filter: {
                name: 'sequenceType',
                type: 'select',
                options: options.sequenceTypes,
            }},
            {label: 'Pending New', show: false, filter: {
                name: 'pendingNew',
                type: 'select',
                options: options.pendingNew,
            }},
        ];
        Object.values(configLabels).forEach((label)=> {
            fields.push({label: label + ' QC Status', show: true}
            );
          });

        const tabs = [{id: 'browse', label: 'Browse'}];


        return (
            <Tabs tabs={tabs} defaultTab="browse" updateURL={true}>
                <TabPane TabId={tabs[0].id}>
                    <FilterableDataTable
                        name="imaging_browser"
                        data={this.state.data.Data}
                        fields={fields}
                        getFormattedCell={this.formatColumn}
                    />
                </TabPane>
            </Tabs>
        );
    }
}

ImagingBrowserIndex.propTypes = {
    dataURL: PropTypes.string.isRequired,
    hasPermission: PropTypes.func.isRequired,
};

window.addEventListener('load', () => {
    ReactDOM.render(
        <ImagingBrowserIndex
            dataURL={`${loris.BaseURL}/imaging_browser/?format=json`}
            hasPermission={loris.userHasPermission}
        />,
        document.getElementById('lorisworkspace')
    );
});
