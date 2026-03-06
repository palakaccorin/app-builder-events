/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

async function main() {
    const extensionId = 'CustomMenu'
    const meshId = '7a53281c-1bfa-48d9-831d-24845ff7cf98'

    return {
        statusCode: 200,
        body: {
            registration: {
                menuItems: [
                    {
                        id: `${extensionId}::first`,
                        title: 'App Builder Order List',
                        parent: `Magento_Sales::sales_operation`,
                        sortOrder: 1
                    },
                    // {
                    //     id: `${extensionId}::apps`,
                    //     title: 'App Builder',
                    //     isSection: true,
                    //     sortOrder: 100
                    // }
                ],
                page: {
                    title: 'App on App Builder'
                },
                customer: {
                    gridColumns: {
                        data: {
                            meshId: meshId
                        },
                        properties:[
                            {
                                label: 'First App Column',
                                columnId: 'first_column',
                                type: 'string',
                                align: 'left'
                            },
                            {
                                label: 'Second App Column',
                                columnId: 'second_column',
                                type: 'integer',
                                align: 'left'
                            },
                            {
                                label: 'Third App Column',
                                columnId: 'third_column',
                                type: 'date',
                                align: 'left'
                            }
                        ]
                    },
                    massActions: [
                        {
                            actionId: `${extensionId}::customer-mass-action`,
                            label: 'Customer Mass Action',
                            confirm: {
                                title: 'Mass Action',
                                message: 'Are you sure your want to proceed with Mass Action on selected customers?'
                            },
                            path: '#/customer-mass-action',
                            selectionLimit: 1
                        },
                        {
                            actionId: `${extensionId}::mass-action-with-redirect`,
                            label: 'Mass Action With Redirect',
                            title: 'Customer Mass Action With Redirect',
                            path: '#/mass-action-with-redirect'
                        },
                        {
                            actionId: `${extensionId}::mass-action-no-iFrame`,
                            label: 'Mass Action No iFrame',
                            path: 'api/v1/web/customers/massAction',
                            displayIframe: false
                        }
                    ]                
                },
                order: {
                    viewButtons: [
                        {
                            buttonId: `${extensionId}::delete-order`,
                            label: 'Delete',
                            confirm: {
                                message: 'Are you sure your want to proceed to delete order?'
                            },
                            path: '#/delete-order',
                            class: 'custom',
                            level: 0,
                            sortOrder: 80
                        },
                        {
                            buttonId: `${extensionId}::create-return`,
                            label: 'Create Return',
                            path: '#/create-return',
                            class: 'custom',
                            level: 0,
                            sortOrder: 80
                        }
                    ],
                    customFees: [
                        {
                            id: 'test-fee-1',
                            label: 'Test Fee 1',
                            value: 1.00,
                            applyFeeOnLastCreditMemo: false
                        },
                        {
                            id: 'test-fee-2',
                            label: 'Test Fee 2',
                            value: 5.00,
                            orderMinimumAmount: 20,
                            applyFeeOnLastInvoice: true
                        }
                    ]
                }
            }
        }
    }
}

exports.main = main
