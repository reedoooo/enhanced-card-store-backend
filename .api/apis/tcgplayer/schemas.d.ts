declare const AppAuthorizeApplication: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly authCode: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Authorization code generated from OAuth.";
                };
            };
            readonly required: readonly ["authCode"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly authorizationKey: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const BuylistGetSellerBuylistInventory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly itemsPerPage: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly productConditionId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly categoryName: {
                                readonly type: "string";
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly cleanProductName: {
                                readonly type: "string";
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                            readonly cleanSetName: {
                                readonly type: "string";
                            };
                            readonly rarity: {
                                readonly type: "string";
                            };
                            readonly conditionName: {
                                readonly type: "string";
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly pendingQuantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategories: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of categories to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of categories to return. Default is 10.";
                };
                readonly sortOrder: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The name of the property by which to sort the returned categories. If not\r\nspecified, results will be sorted by name.";
                };
                readonly sortDesc: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true then sort descending, otherwise sort ascending.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly displayName: {
                                readonly type: "string";
                            };
                            readonly seoCategoryName: {
                                readonly type: "string";
                            };
                            readonly sealedLabel: {
                                readonly type: "string";
                            };
                            readonly nonSealedLabel: {
                                readonly type: "string";
                            };
                            readonly conditionGuideUrl: {
                                readonly type: "string";
                            };
                            readonly isScannable: {
                                readonly type: "boolean";
                            };
                            readonly popularity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids if the categories to be returned.";
                };
            };
            readonly required: readonly ["categoryIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly displayName: {
                                readonly type: "string";
                            };
                            readonly seoCategoryName: {
                                readonly type: "string";
                            };
                            readonly sealedLabel: {
                                readonly type: "string";
                            };
                            readonly nonSealedLabel: {
                                readonly type: "string";
                            };
                            readonly conditionGuideUrl: {
                                readonly type: "string";
                            };
                            readonly isScannable: {
                                readonly type: "boolean";
                            };
                            readonly popularity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly displayName: {
                                readonly type: "string";
                            };
                            readonly seoCategoryName: {
                                readonly type: "string";
                            };
                            readonly sealedLabel: {
                                readonly type: "string";
                            };
                            readonly nonSealedLabel: {
                                readonly type: "string";
                            };
                            readonly conditionGuideUrl: {
                                readonly type: "string";
                            };
                            readonly isScannable: {
                                readonly type: "boolean";
                            };
                            readonly popularity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategoryConditions: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category whose conditions should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly displayOrder: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategoryGroups: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category whose groups should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of groups to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of groups to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly isSupplemental: {
                                readonly type: "boolean";
                            };
                            readonly publishedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategoryLanguages: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category whose languages should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly languageId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbr: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategoryMedia: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the Category whose media should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly mediaType: {
                                readonly type: "string";
                            };
                            readonly contentList: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly url: {
                                            readonly type: "string";
                                        };
                                        readonly displayOrder: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategoryPrintings: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category whose printings should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly printingId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly displayOrder: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategoryRarities: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category whose rarities should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly rarityId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly displayText: {
                                readonly type: "string";
                            };
                            readonly dbValue: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetCategorySearchManifest: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category whose search manifest should be returned.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly sorting: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly text: {
                                            readonly type: "string";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly filters: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly displayName: {
                                            readonly type: "string";
                                        };
                                        readonly inputType: {
                                            readonly type: "string";
                                        };
                                        readonly items: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly text: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetConditions: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly displayOrder: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetGroup: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly groupIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids for the groups to return.";
                };
            };
            readonly required: readonly ["groupIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly isSupplemental: {
                                readonly type: "boolean";
                            };
                            readonly publishedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly isSupplemental: {
                                readonly type: "boolean";
                            };
                            readonly publishedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetGroupMedia: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the group whose media should be returned.";
                };
            };
            readonly required: readonly ["groupId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly mediaType: {
                                readonly type: "string";
                            };
                            readonly contentList: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly url: {
                                            readonly type: "string";
                                        };
                                        readonly displayOrder: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetGroups: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return groups from this category.";
                };
                readonly categoryName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return groups from categories with this exact name.";
                };
                readonly isSupplemental: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, only return supplemental groups.  If false, return only non-supplemental\r\ngroups. Otherwise, return all groups regardless of whether they are supplemental or\r\nnot.";
                };
                readonly hasSealed: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, only return groups that contain sealed product.  If false, only return\r\ngroups that do not contain sealed product.  Otherwise, return all groups regardless\r\nof whether they have sealed product or not.";
                };
                readonly sortOrder: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The name of the property to sort the returned groups by. Default is GroupName.";
                };
                readonly sortDesc: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true then sort descending, otherwise sort ascending.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of groups to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of groups to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly isSupplemental: {
                                readonly type: "boolean";
                            };
                            readonly publishedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetProduct: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids for the products to return.";
                };
            };
            readonly required: readonly ["productIds"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly getExtendedFields: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, include additional Category-specific information about each Product, otherwise\r\nonly return general Product information. Default is false.";
                };
                readonly includeSkus: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, include SKU details for each product.  Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly cleanName: {
                                readonly type: "string";
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly url: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly languageId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly printingId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly conditionId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                            readonly imageCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly presaleInfo: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly isPresale: {
                                        readonly type: "boolean";
                                    };
                                    readonly releasedOn: {
                                        readonly format: "date-time";
                                        readonly type: "string";
                                    };
                                    readonly note: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly extendedData: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly displayName: {
                                            readonly type: "string";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly cleanName: {
                                readonly type: "string";
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly url: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly languageId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly printingId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly conditionId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                            readonly imageCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly presaleInfo: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly isPresale: {
                                        readonly type: "boolean";
                                    };
                                    readonly releasedOn: {
                                        readonly format: "date-time";
                                        readonly type: "string";
                                    };
                                    readonly note: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly extendedData: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly displayName: {
                                            readonly type: "string";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetProductByGtin: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly gtin: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A product code from the GTIN family of codes for Product to be returned.";
                };
            };
            readonly required: readonly ["gtin"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly getExtendedFields: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, include additional category-specific information about the Product,\r\notherwise only return general product information. Default is false.";
                };
                readonly includeSkus: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, include SKU details for the Product.  Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly cleanName: {
                                readonly type: "string";
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly url: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly languageId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly printingId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly conditionId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                            readonly imageCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly presaleInfo: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly isPresale: {
                                        readonly type: "boolean";
                                    };
                                    readonly releasedOn: {
                                        readonly format: "date-time";
                                        readonly type: "string";
                                    };
                                    readonly note: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly extendedData: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly displayName: {
                                            readonly type: "string";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetProductMedia: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the product whose media should be returned.";
                };
            };
            readonly required: readonly ["productId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly mediaType: {
                                readonly type: "string";
                            };
                            readonly contentList: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly url: {
                                            readonly type: "string";
                                        };
                                        readonly displayOrder: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetProducts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products in this category.";
                };
                readonly categoryName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products in this category.";
                };
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products in this group.";
                };
                readonly groupName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products in this group.";
                };
                readonly productName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products with this exact name.";
                };
                readonly getExtendedFields: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, include additional category-specific information about each product, otherwise\r\nonly return general product. Default is false.";
                };
                readonly productTypes: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma-separated list of Product Types. If specified, only return Products that\r\nbelong to one of the Product Types in the list. Some valid values: Cards, Booster Pack,\r\nBooster Box.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of Products to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of Products to return. Default is 10.";
                };
                readonly includeSkus: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, include SKU details for each product.  Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly cleanName: {
                                readonly type: "string";
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly url: {
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly languageId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly printingId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly conditionId: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                            readonly imageCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly presaleInfo: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly isPresale: {
                                        readonly type: "boolean";
                                    };
                                    readonly releasedOn: {
                                        readonly format: "date-time";
                                        readonly type: "string";
                                    };
                                    readonly note: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly extendedData: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly displayName: {
                                            readonly type: "string";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetProductsAlsoPurchasedByProductId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the anchor product.";
                };
            };
            readonly required: readonly ["productId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, the maximum number of related products to be returned. Default is 10.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of categories to skip. Default is 0.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly cardId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                            readonly cleanSetName: {
                                readonly type: "string";
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly purchasedProductName: {
                                readonly type: "string";
                            };
                            readonly purchasedProductCleanName: {
                                readonly type: "string";
                            };
                            readonly purchasedCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly lowestPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly purchasedStoreProductId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly addedDt: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly usesCdn: {
                                readonly type: "boolean";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetRecentSalesByProductId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the product.";
                };
            };
            readonly required: readonly ["productId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly resultCount: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, the maximum number of sales to be returned. If not specified, then the\r\nglobal default limit will be used instead.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly soldOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetRecentSalesBySkuId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the SKU.";
                };
            };
            readonly required: readonly ["skuId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly resultCount: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, the maximum number of sales to be returned. If not specified, then the\r\nglobal default limit will be used instead.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly soldOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetSkus: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly skuIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma-delimited list of Ids for the SKUs to be returned.";
                };
            };
            readonly required: readonly ["skuIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly languageId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly printingId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly languageId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly printingId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogGetSkusByProductId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the product.";
                };
            };
            readonly required: readonly ["productId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly languageId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly printingId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const CatalogSearchCategory: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly offset: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly limit: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly sort: {
                readonly type: "string";
            };
            readonly includeAggregates: {
                readonly type: "boolean";
            };
            readonly filters: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                        readonly values: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the category to search.";
                };
            };
            readonly required: readonly ["categoryId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly aggregates: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly filterName: {
                                readonly type: "string";
                            };
                            readonly values: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly value: {
                                            readonly type: "string";
                                        };
                                        readonly count: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly format: "int64";
                        readonly type: "integer";
                        readonly minimum: -9223372036854776000;
                        readonly maximum: 9223372036854776000;
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const InventoryCreateProductList: {
    readonly body: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly quantity: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly productConditionId: {
                    readonly format: "int64";
                    readonly type: "integer";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productListKey: {
                                readonly format: "uuid";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const InventoryGetProductList: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productListId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productListKey: {
                                readonly format: "uuid";
                                readonly type: "string";
                            };
                            readonly createdOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const InventoryGetProductListById: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productListId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the ProductList to be returned.";
                };
            };
            readonly required: readonly ["productListId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productListItems: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly productListItemId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly quantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly productCondition: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly productConditionId: {
                                                    readonly format: "int64";
                                                    readonly type: "integer";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly language: {
                                                    readonly type: "string";
                                                };
                                                readonly isFoil: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly productListId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productListKey: {
                                readonly format: "uuid";
                                readonly type: "string";
                            };
                            readonly createdOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const InventoryGetProductListByKey: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productListKey: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Key of the ProductList to be returned.";
                };
            };
            readonly required: readonly ["productListKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productListItems: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly productListItemId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly quantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly productCondition: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly productConditionId: {
                                                    readonly format: "int64";
                                                    readonly type: "integer";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly language: {
                                                    readonly type: "string";
                                                };
                                                readonly isFoil: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly productListId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productListKey: {
                                readonly format: "uuid";
                                readonly type: "string";
                            };
                            readonly createdOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const MarketplaceClearMarketplaceCart: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly cartKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Identifier for the shopping cart.";
                };
            };
            readonly required: readonly ["cartKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const MarketplaceCreateInStorePickupPayLaterOrder: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly cartKey: {
                readonly type: "string";
            };
            readonly firstName: {
                readonly type: "string";
            };
            readonly lastName: {
                readonly type: "string";
            };
            readonly email: {
                readonly type: "string";
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly orderNumber: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const MarketplaceGetMarketplaceCart: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly cartKey: {
                                readonly type: "string";
                            };
                            readonly itemCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly hasChanged: {
                                readonly type: "boolean";
                            };
                            readonly cartItems: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productName: {
                                            readonly type: "string";
                                        };
                                        readonly groupName: {
                                            readonly type: "string";
                                        };
                                        readonly categoryName: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly condition: {
                                            readonly type: "string";
                                        };
                                        readonly printing: {
                                            readonly type: "string";
                                        };
                                        readonly requestedQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly availableQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly productImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly customDescription: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const MarketplaceGetMarketplaceCartByCartKey: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly cartKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Identifier for the shopping cart.";
                };
            };
            readonly required: readonly ["cartKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly cartKey: {
                                readonly type: "string";
                            };
                            readonly itemCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly hasChanged: {
                                readonly type: "boolean";
                            };
                            readonly cartItems: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productName: {
                                            readonly type: "string";
                                        };
                                        readonly groupName: {
                                            readonly type: "string";
                                        };
                                        readonly categoryName: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly condition: {
                                            readonly type: "string";
                                        };
                                        readonly printing: {
                                            readonly type: "string";
                                        };
                                        readonly requestedQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly availableQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly productImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly customDescription: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const MarketplaceReconcileCarts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly cartKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Identifier for the shopping cart.";
                };
            };
            readonly required: readonly ["cartKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly cartKey: {
                                readonly type: "string";
                            };
                            readonly itemCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly hasChanged: {
                                readonly type: "boolean";
                            };
                            readonly cartItems: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productName: {
                                            readonly type: "string";
                                        };
                                        readonly groupName: {
                                            readonly type: "string";
                                        };
                                        readonly categoryName: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly condition: {
                                            readonly type: "string";
                                        };
                                        readonly printing: {
                                            readonly type: "string";
                                        };
                                        readonly requestedQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly availableQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly productImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly customDescription: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const MarketplaceUpdateMarketplaceCart: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly user: {
                readonly type: "string";
            };
            readonly cartKey: {
                readonly type: "string";
            };
            readonly skuId: {
                readonly format: "int64";
                readonly type: "integer";
                readonly minimum: -9223372036854776000;
                readonly maximum: 9223372036854776000;
            };
            readonly storePriceCustomId: {
                readonly format: "int64";
                readonly type: "integer";
                readonly minimum: -9223372036854776000;
                readonly maximum: 9223372036854776000;
            };
            readonly channelId: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly quantity: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly replaceCartItem: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, will overwrite same cart SkuId quantity specified in criteria, otherwise adds the Quantity instead. Default is true.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly cartKey: {
                                readonly type: "string";
                            };
                            readonly itemCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly hasChanged: {
                                readonly type: "boolean";
                            };
                            readonly cartItems: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly productName: {
                                            readonly type: "string";
                                        };
                                        readonly groupName: {
                                            readonly type: "string";
                                        };
                                        readonly categoryName: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly condition: {
                                            readonly type: "string";
                                        };
                                        readonly printing: {
                                            readonly type: "string";
                                        };
                                        readonly requestedQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly availableQuantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly productImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly customDescription: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetGroupBuylistPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Id of the group to return product buylist prices for.";
                };
            };
            readonly required: readonly ["groupId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly prices: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly format: "double";
                                    readonly type: "number";
                                    readonly minimum: -1.7976931348623157e+308;
                                    readonly maximum: 1.7976931348623157e+308;
                                };
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly prices: {
                                            readonly type: "object";
                                            readonly additionalProperties: {
                                                readonly format: "double";
                                                readonly type: "number";
                                                readonly minimum: -1.7976931348623157e+308;
                                                readonly maximum: 1.7976931348623157e+308;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetGroupPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Id of the group to return product prices for.";
                };
            };
            readonly required: readonly ["groupId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly lowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly midPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly highPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly marketPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly directLowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly subTypeName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetMarketPriceByProductConditionId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productconditionId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The Id of the SKU being queried.";
                };
            };
            readonly required: readonly ["productconditionId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productConditionId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly lowestRange: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly highestRange: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetProductBuylistPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids for the Products being queried.";
                };
            };
            readonly required: readonly ["productIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly prices: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly format: "double";
                                    readonly type: "number";
                                    readonly minimum: -1.7976931348623157e+308;
                                    readonly maximum: 1.7976931348623157e+308;
                                };
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly prices: {
                                            readonly type: "object";
                                            readonly additionalProperties: {
                                                readonly format: "double";
                                                readonly type: "number";
                                                readonly minimum: -1.7976931348623157e+308;
                                                readonly maximum: 1.7976931348623157e+308;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly prices: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly format: "double";
                                    readonly type: "number";
                                    readonly minimum: -1.7976931348623157e+308;
                                    readonly maximum: 1.7976931348623157e+308;
                                };
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly prices: {
                                            readonly type: "object";
                                            readonly additionalProperties: {
                                                readonly format: "double";
                                                readonly type: "number";
                                                readonly minimum: -1.7976931348623157e+308;
                                                readonly maximum: 1.7976931348623157e+308;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetProductConditionBuylistPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly skuIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids for the SKUs being queried.";
                };
            };
            readonly required: readonly ["skuIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly prices: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly format: "double";
                                    readonly type: "number";
                                    readonly minimum: -1.7976931348623157e+308;
                                    readonly maximum: 1.7976931348623157e+308;
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly prices: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly format: "double";
                                    readonly type: "number";
                                    readonly minimum: -1.7976931348623157e+308;
                                    readonly maximum: 1.7976931348623157e+308;
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetProductConditionPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly skuIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids for the SKUs being queried.";
                };
            };
            readonly required: readonly ["skuIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly lowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly lowestShipping: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly lowestListingPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly marketPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly directLowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly lowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly lowestShipping: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly lowestListingPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly marketPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly directLowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PricingGetProductPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly productIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of Ids for the Products being queried.";
                };
            };
            readonly required: readonly ["productIds"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly lowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly midPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly highPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly marketPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly directLowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly subTypeName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "207": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly lowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly midPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly highPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly marketPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly directLowPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly subTypeName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresBatchUpdateStoreBuylistPrices: {
    readonly body: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly skuId: {
                    readonly format: "int64";
                    readonly type: "integer";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly price: {
                    readonly format: "double";
                    readonly type: "number";
                    readonly minimum: -1.7976931348623157e+308;
                    readonly maximum: 1.7976931348623157e+308;
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly format: "uuid";
                        readonly type: "string";
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresBatchUpdateStoreSkuPrices: {
    readonly body: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly skuId: {
                    readonly format: "int64";
                    readonly type: "integer";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                };
                readonly price: {
                    readonly format: "double";
                    readonly type: "number";
                    readonly minimum: -1.7976931348623157e+308;
                    readonly maximum: 1.7976931348623157e+308;
                };
                readonly channelId: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly format: "uuid";
                        readonly type: "string";
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresCreateStoreBuylistSku: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly price: {
                readonly format: "double";
                readonly type: "number";
                readonly minimum: -1.7976931348623157e+308;
                readonly maximum: 1.7976931348623157e+308;
            };
            readonly quantity: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the SKU to create in the Store's Buylist.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresCreateStoreOrderTracking: {
    readonly body: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly orderNumber: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The order number for the order being queried.";
                };
            };
            readonly required: readonly ["storeKey", "orderNumber"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly trackingNumber: {
                                readonly type: "string";
                            };
                            readonly carrier: {
                                readonly type: "string";
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                            readonly trackingUrl: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                            };
                            readonly createdOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresCreateStoreSku: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly price: {
                readonly format: "double";
                readonly type: "number";
                readonly minimum: -1.7976931348623157e+308;
                readonly maximum: 1.7976931348623157e+308;
            };
            readonly quantity: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly channelId: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the SKU to register in inventory.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresFreeShippingOptions: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of SellerShippingOptions to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of SellerShippingOptions to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly enabled: {
                                readonly type: "boolean";
                            };
                            readonly threshold: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly shippingCategoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetBuylistProductConditions: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The ProductId to get Product Conditions for.";
                };
            };
            readonly required: readonly ["storeKey", "productId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productConditions: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly conditionName: {
                                            readonly type: "string";
                                        };
                                        readonly isFoil: {
                                            readonly type: "boolean";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly productConditionId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly quantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                    };
                                };
                            };
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productImageUrl: {
                                readonly type: "string";
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetBuylistProducts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly searchTerm: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The term which must be contained in either the Product Name or Set Name of the Products.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The number of Products to skip in the initial result set.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The maximum number of Products to be returned.";
                };
                readonly sortDirection: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The direction of the sort to be applied to the initial result set. Products are sorted by Product Name then Set Name. Options are ASC or DESC. Defaults to ASC.";
                };
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided will only return Buylist Products in the Category.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly maxPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly minPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productImageUrl: {
                                readonly type: "string";
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetCustomListing: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The unique store key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly photoId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The unique identifier for any photo associated with the custom listing.";
                };
            };
            readonly required: readonly ["photoId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly customListingId: {
                                readonly type: "string";
                            };
                            readonly url: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetIdentity: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly storeKey: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly level: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                            };
                            readonly isCertifiedHobbyShop: {
                                readonly type: "boolean";
                            };
                            readonly isDirect: {
                                readonly type: "boolean";
                            };
                            readonly isGoldStar: {
                                readonly type: "boolean";
                            };
                            readonly completedSalesRank: {
                                readonly type: "string";
                            };
                            readonly emailContact: {
                                readonly type: "string";
                            };
                            readonly storefrontUrl: {
                                readonly type: "string";
                            };
                            readonly isProStore: {
                                readonly type: "boolean";
                            };
                            readonly inventoryValueCurrent: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly inventoryValueLimit: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly productCountCurrent: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly productCountLimit: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly dailyEntryCountCurrent: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly dailyEntryCountLimit: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly productPriceMax: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetInventoryProductQuantity: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Identity of the Product being searched for.";
                };
            };
            readonly required: readonly ["storeKey", "productId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results.  Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories.  Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly totalQuantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly storePriceCustomId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly quantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly isCustom: {
                                            readonly type: "boolean";
                                        };
                                        readonly title: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetInventorySkuPrice: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuListPriceId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Identifier for the skuListPrice or custom listing being searched for.";
                };
            };
            readonly required: readonly ["storeKey", "skuListPriceId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuListPriceId: {
                                readonly type: "string";
                            };
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetInventorySkuPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return SkuListPrices from this Group.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return SkuListPrices with this SkuId.";
                };
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results.  Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories.  Default is false.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of SkuListPrices to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of SkuListPrices to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuListPriceId: {
                                readonly type: "string";
                            };
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetInventorySkuQuantity: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Identity of the SKU being searched for.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results. Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories. Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetProIdentity: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly storeName: {
                                readonly type: "string";
                            };
                            readonly streetAddress: {
                                readonly type: "string";
                            };
                            readonly city: {
                                readonly type: "string";
                            };
                            readonly state: {
                                readonly type: "string";
                            };
                            readonly zip: {
                                readonly type: "string";
                            };
                            readonly emailAddress: {
                                readonly type: "string";
                            };
                            readonly phone: {
                                readonly type: "string";
                            };
                            readonly storefrontUrl: {
                                readonly type: "string";
                            };
                            readonly logoUrl: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetRelatedProducts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the Product to get Related Products for.";
                };
            };
            readonly required: readonly ["storeKey", "productId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results.  Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories.  Default is false.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of Related Products to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of Related Products to return. Default is 10.";
                };
                readonly myInventoryOnly: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, only return Related Products the seller has in stock.\r\nOtherwise, return all Related Products.  Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly relatedProductName: {
                                readonly type: "string";
                            };
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly gameName: {
                                readonly type: "string";
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetSellerBuylistCategories: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetSellerBuylistSets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly isSupplemental: {
                                readonly type: "boolean";
                            };
                            readonly publishedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetSellerBuylistSettings: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly isEnabled: {
                                readonly type: "boolean";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetSkuBuylistPrice: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuBuylistPriceId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Identity of the skuBuylistPrice being searched for.";
                };
            };
            readonly required: readonly ["storeKey", "skuBuylistPriceId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuBuylistPriceId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetSkuBuylistPrices: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return SkuBuylistPrices from this Group.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return SkuBuylistPrices with this SkuId.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of SkuBuylistPrices to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of SkuBuylistPrices to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuBuylistPriceId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreAddress: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the Store being queried.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly address1: {
                                readonly type: "string";
                            };
                            readonly address2: {
                                readonly type: "string";
                            };
                            readonly city: {
                                readonly type: "string";
                            };
                            readonly stateProvince: {
                                readonly type: "string";
                            };
                            readonly postalCode: {
                                readonly type: "string";
                            };
                            readonly country: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreCategories: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results. Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories. Default is false.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of Categories to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of Categories to return. Default is 10.";
                };
                readonly inStockOnly: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results only for in-stock Categories. Default is true.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreChannels: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of Channels to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of Channels to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly channelId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly channelName: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreCustomer: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly token: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Represents the unique seller and customer combination.";
                };
            };
            readonly required: readonly ["storeKey", "token"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly totalOrderCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly totalProductAmount: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreCustomerAddresses: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly token: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Represents the unique seller and customer combination.";
                };
            };
            readonly required: readonly ["storeKey", "token"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of records to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of records to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly firstName: {
                                readonly type: "string";
                            };
                            readonly lastName: {
                                readonly type: "string";
                            };
                            readonly address1: {
                                readonly type: "string";
                            };
                            readonly address2: {
                                readonly type: "string";
                            };
                            readonly city: {
                                readonly type: "string";
                            };
                            readonly state: {
                                readonly type: "string";
                            };
                            readonly postalCode: {
                                readonly type: "string";
                            };
                            readonly country: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreCustomerOrderSummary: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly token: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. Represents the unique seller and customer combination.";
                };
            };
            readonly required: readonly ["storeKey", "token"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of records to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of records to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly orderNumber: {
                                readonly type: "string";
                            };
                            readonly orderDate: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly totalProductQuantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly totalProductAmount: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreCustomers: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly name: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A string of characters representing the first name and/or last name of the customer being searched for. Use format \"firstName,lastName\"";
                };
                readonly email: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The email of the customer.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of records to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of records to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly token: {
                                readonly type: "string";
                            };
                            readonly firstName: {
                                readonly type: "string";
                            };
                            readonly lastName: {
                                readonly type: "string";
                            };
                            readonly email: {
                                readonly type: "string";
                            };
                            readonly shippingAddress: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly firstName: {
                                        readonly type: "string";
                                    };
                                    readonly lastName: {
                                        readonly type: "string";
                                    };
                                    readonly address1: {
                                        readonly type: "string";
                                    };
                                    readonly address2: {
                                        readonly type: "string";
                                    };
                                    readonly city: {
                                        readonly type: "string";
                                    };
                                    readonly state: {
                                        readonly type: "string";
                                    };
                                    readonly postalCode: {
                                        readonly type: "string";
                                    };
                                    readonly country: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreFeedback: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly positive30DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly neutral30DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly negative30DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly positive90DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly neutral90DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly negative90DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly positive365DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly neutral365DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly negative365DayCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly positiveLifetimeCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly neutralLifetimeCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly negativeLifetimeCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreGroups: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, this request will only return groups from the specified category.";
                };
                readonly categoryName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, this request will only return groups from the specified category";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results.  Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories.  Default is false.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of Groups to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of Groups to return. Default is 10.";
                };
                readonly inStockOnly: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will only return Groups which are in-stock.\r\nIf false, will include Groups which have prices but aren't in stock.\r\nIf null, will use Sellers 'Hide Sets without Inventory' Pro Setting.\r\nDefault is null.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly groupId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly abbreviation: {
                                readonly type: "string";
                            };
                            readonly isSupplemental: {
                                readonly type: "boolean";
                            };
                            readonly publishedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly categoryId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreInventory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products from this Category.";
                };
                readonly categoryName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products from this Category.";
                };
                readonly groupId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products from this Group.";
                };
                readonly groupName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products from this Group.";
                };
                readonly productName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products with names that contain this string.";
                };
                readonly skuLimit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The maximum number of SKUs to use in the inventory summary. Default is 3.";
                };
                readonly sort: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, sort the results by this value. Default is descending by Price.";
                };
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results.  Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories.  Default is false.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of StoreProducts to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of StoreProducts to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly category: {
                                readonly type: "string";
                            };
                            readonly group: {
                                readonly type: "string";
                            };
                            readonly rarity: {
                                readonly type: "string";
                            };
                            readonly number: {
                                readonly type: "string";
                            };
                            readonly skuCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly lowestPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly storePriceCustomId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly condition: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly conditionId: {
                                                    readonly format: "int64";
                                                    readonly type: "integer";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly language: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly languageId: {
                                                    readonly format: "int32";
                                                    readonly type: "integer";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly abbr: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly foil: {
                                            readonly type: "boolean";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly quantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly isFeatured: {
                                            readonly type: "boolean";
                                        };
                                        readonly isCustom: {
                                            readonly type: "boolean";
                                        };
                                        readonly title: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreOrderFeedback: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly orderNumber: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The order number associated with the feedback.";
                };
            };
            readonly required: readonly ["storeKey", "orderNumber"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly rating: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly comment: {
                                readonly type: "string";
                            };
                            readonly createdOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreOrderLineItems: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly orderNumber: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The order number for the order being queried.";
                };
            };
            readonly required: readonly ["storeKey", "orderNumber"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of order line items to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of order line items to return. Default is 10.";
                };
                readonly includeItemDetails: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, will include details about the products returned. Default is false";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly categoryName: {
                                readonly type: "string";
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly groupName: {
                                readonly type: "string";
                            };
                            readonly condition: {
                                readonly type: "string";
                            };
                            readonly conditionId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly printing: {
                                readonly type: "string";
                            };
                            readonly language: {
                                readonly type: "string";
                            };
                            readonly rarity: {
                                readonly type: "string";
                            };
                            readonly isFoil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly productImageUrl: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreOrderManifest: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly orderTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly orderChannelTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly orderStatusTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly orderPickupStatusTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly orderDeliveryTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly orderPresaleStatusTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                            readonly orderRefundTypes: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreOrderTracking: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly orderNumber: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The order being queried.";
                };
            };
            readonly required: readonly ["storeKey", "orderNumber"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly trackingNumber: {
                                readonly type: "string";
                            };
                            readonly carrier: {
                                readonly type: "string";
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                            readonly trackingUrl: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                            };
                            readonly createdOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreOrders: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly orderNumber: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, only return the order for the order number specified.";
                };
                readonly customerName: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, only return orders where the buyer's name contains the specified string. Format \"Firstname, Lastname\".";
                };
                readonly customerEmail: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, only return orders where the buyer's email address contains the specified string.";
                };
                readonly minOrderValue: {
                    readonly type: "number";
                    readonly format: "double";
                    readonly minimum: -1.7976931348623157e+308;
                    readonly maximum: 1.7976931348623157e+308;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, only return orders with ProductAmt &gt;= the specified value.";
                };
                readonly maxOrderValue: {
                    readonly type: "number";
                    readonly format: "double";
                    readonly minimum: -1.7976931348623157e+308;
                    readonly maximum: 1.7976931348623157e+308;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, only return orders with ProductAmt &lt;= the specified value.";
                };
                readonly channelIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of order channel Ids. If provided, only return orders from the specified channels.";
                };
                readonly orderStatusIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of order status Ids. If provided, only return orders in the specified order statuses.";
                };
                readonly pickupStatusIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of pickup status Ids. If provided, only return orders in the specified pickup statuses.";
                };
                readonly deliveryTypeIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of deliveryTypeIds. If provided, only return orders in the specified delivery types.";
                };
                readonly presaleStatusIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of presale status Ids. If provided, only return orders in the specified presale statuses.";
                };
                readonly orderTypeIds: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A comma delimited list of order type Ids. If provided, only return orders in the specified order types.";
                };
                readonly sort: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for sorting. Default is \"OrderStatus Asc\".  Acceptable sort terms are: OrderNumber, OrderDate, OrderStatus, ShippingName, ProductAmt, ShippingAmt, SellerTaxAmt, OrderAmt";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of order numbers to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of order numbers to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreOrdersByOrderNumber: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly orderNumbers: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A comma delimited list of order numbers for the orders being queried.";
                };
            };
            readonly required: readonly ["storeKey", "orderNumbers"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly orderNumber: {
                                readonly type: "string";
                            };
                            readonly orderChannelTypeId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly orderStatusTypeId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly orderDeliveryTypeId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly orderPickupStatusTypeId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly buyerPaid: {
                                readonly type: "boolean";
                            };
                            readonly isDirect: {
                                readonly type: "boolean";
                            };
                            readonly isInternational: {
                                readonly type: "boolean";
                            };
                            readonly presaleStatusTypeId: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly orderedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly modifiedOn: {
                                readonly format: "date-time";
                                readonly type: "string";
                            };
                            readonly customer: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly token: {
                                        readonly type: "string";
                                    };
                                    readonly firstName: {
                                        readonly type: "string";
                                    };
                                    readonly lastName: {
                                        readonly type: "string";
                                    };
                                    readonly email: {
                                        readonly type: "string";
                                    };
                                    readonly shippingAddress: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly firstName: {
                                                readonly type: "string";
                                            };
                                            readonly lastName: {
                                                readonly type: "string";
                                            };
                                            readonly address1: {
                                                readonly type: "string";
                                            };
                                            readonly address2: {
                                                readonly type: "string";
                                            };
                                            readonly city: {
                                                readonly type: "string";
                                            };
                                            readonly state: {
                                                readonly type: "string";
                                            };
                                            readonly postalCode: {
                                                readonly type: "string";
                                            };
                                            readonly country: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly orderValue: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly product: {
                                        readonly format: "double";
                                        readonly type: "number";
                                        readonly minimum: -1.7976931348623157e+308;
                                        readonly maximum: 1.7976931348623157e+308;
                                    };
                                    readonly shipping: {
                                        readonly format: "double";
                                        readonly type: "number";
                                        readonly minimum: -1.7976931348623157e+308;
                                        readonly maximum: 1.7976931348623157e+308;
                                    };
                                    readonly tax: {
                                        readonly format: "double";
                                        readonly type: "number";
                                        readonly minimum: -1.7976931348623157e+308;
                                        readonly maximum: 1.7976931348623157e+308;
                                    };
                                    readonly gross: {
                                        readonly format: "double";
                                        readonly type: "number";
                                        readonly minimum: -1.7976931348623157e+308;
                                        readonly maximum: 1.7976931348623157e+308;
                                    };
                                    readonly fees: {
                                        readonly format: "double";
                                        readonly type: "number";
                                        readonly minimum: -1.7976931348623157e+308;
                                        readonly maximum: 1.7976931348623157e+308;
                                    };
                                    readonly net: {
                                        readonly format: "double";
                                        readonly type: "number";
                                        readonly minimum: -1.7976931348623157e+308;
                                        readonly maximum: 1.7976931348623157e+308;
                                    };
                                };
                            };
                            readonly productCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoreProductSkus: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the Product being queried.";
                };
            };
            readonly required: readonly ["storeKey", "productId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of SKUs to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of SKUs to return. Default is 10.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results.  Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories.  Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStores: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly name: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Optional filter to search by store name.";
                };
                readonly address: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Optional filter to search by store address.";
                };
                readonly city: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Optional filter to search by store city.";
                };
                readonly state: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Optional filter to search by store state.";
                };
                readonly zipCode: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Optional filter to search by store ZIP/Postal code.";
                };
                readonly sort: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, sort the results by this value. Default is \"Name ASC\".";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of records to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of records to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetStoresByStoreKey: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKeys: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A list of unique keys used to identify the stores being queried.";
                };
            };
            readonly required: readonly ["storeKeys"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly storeKey: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly level: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                            };
                            readonly isCertifiedHobbyShop: {
                                readonly type: "boolean";
                            };
                            readonly isDirect: {
                                readonly type: "boolean";
                            };
                            readonly isGoldStar: {
                                readonly type: "boolean";
                            };
                            readonly completedSalesRank: {
                                readonly type: "string";
                            };
                            readonly emailContact: {
                                readonly type: "string";
                            };
                            readonly storefrontUrl: {
                                readonly type: "string";
                            };
                            readonly isProStore: {
                                readonly type: "boolean";
                            };
                            readonly inventoryValueCurrent: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly inventoryValueLimit: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly productCountCurrent: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly productCountLimit: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly dailyEntryCountCurrent: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly dailyEntryCountLimit: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly productPriceMax: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresGetTopSalesForSeller: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If provided, this request will only return products from the specified category.";
                };
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results. Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories. Default is false.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of TopSoldProducts to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of TopSoldProducts to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                            readonly categoryName: {
                                readonly type: "string";
                            };
                            readonly rarity: {
                                readonly type: "string";
                            };
                            readonly number: {
                                readonly type: "string";
                            };
                            readonly lowestPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresProductSearchByCategory: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly offset: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly limit: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly sort: {
                readonly type: "string";
            };
            readonly includeAggregates: {
                readonly type: "boolean";
            };
            readonly filters: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                        };
                        readonly values: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly categoryId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, only return products from this Category.";
                };
            };
            readonly required: readonly ["storeKey", "categoryId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly skuLimit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The maximum number of SKUs to use in the inventory summary. Default is 3.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly channelId: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The channel to search for results. Defaults to 0, the TCG Marketplace.";
                };
                readonly includeExcludedCategories: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If true, will return results for excluded categories. Default is false.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly category: {
                                readonly type: "string";
                            };
                            readonly group: {
                                readonly type: "string";
                            };
                            readonly rarity: {
                                readonly type: "string";
                            };
                            readonly number: {
                                readonly type: "string";
                            };
                            readonly skuCount: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly lowestPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly skus: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly skuId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly storePriceCustomId: {
                                            readonly format: "int64";
                                            readonly type: "integer";
                                            readonly minimum: -9223372036854776000;
                                            readonly maximum: 9223372036854776000;
                                        };
                                        readonly condition: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly conditionId: {
                                                    readonly format: "int64";
                                                    readonly type: "integer";
                                                    readonly minimum: -9223372036854776000;
                                                    readonly maximum: 9223372036854776000;
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly language: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly languageId: {
                                                    readonly format: "int32";
                                                    readonly type: "integer";
                                                    readonly minimum: -2147483648;
                                                    readonly maximum: 2147483647;
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly abbr: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly foil: {
                                            readonly type: "boolean";
                                        };
                                        readonly price: {
                                            readonly format: "double";
                                            readonly type: "number";
                                            readonly minimum: -1.7976931348623157e+308;
                                            readonly maximum: 1.7976931348623157e+308;
                                        };
                                        readonly quantity: {
                                            readonly format: "int32";
                                            readonly type: "integer";
                                            readonly minimum: -2147483648;
                                            readonly maximum: 2147483647;
                                        };
                                        readonly isFeatured: {
                                            readonly type: "boolean";
                                        };
                                        readonly isCustom: {
                                            readonly type: "boolean";
                                        };
                                        readonly title: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly mainImageUrl: {
                                            readonly type: "string";
                                        };
                                        readonly additionalImageUrls: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresPutProIdentity: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly storeName: {
                readonly type: "string";
            };
            readonly streetAddress: {
                readonly type: "string";
            };
            readonly city: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
            };
            readonly zip: {
                readonly type: "string";
            };
            readonly emailAddress: {
                readonly type: "string";
            };
            readonly phone: {
                readonly type: "string";
            };
            readonly storefrontUrl: {
                readonly type: "string";
            };
            readonly logoUrl: {
                readonly type: "string";
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly storeName: {
                                readonly type: "string";
                            };
                            readonly streetAddress: {
                                readonly type: "string";
                            };
                            readonly city: {
                                readonly type: "string";
                            };
                            readonly state: {
                                readonly type: "string";
                            };
                            readonly zip: {
                                readonly type: "string";
                            };
                            readonly emailAddress: {
                                readonly type: "string";
                            };
                            readonly phone: {
                                readonly type: "string";
                            };
                            readonly storefrontUrl: {
                                readonly type: "string";
                            };
                            readonly logoUrl: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresSearchInventory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly q: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The string to search for in Product, Category, and Group names.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of SearchResults to return. Default is 10.";
                };
            };
            readonly required: readonly ["q"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                            readonly cleanSetName: {
                                readonly type: "string";
                            };
                            readonly categoryName: {
                                readonly type: "string";
                            };
                            readonly cleanCategoryName: {
                                readonly type: "string";
                            };
                            readonly matchType: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresSetStoreStatus: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. \"active\" or \"inactive\"";
                };
            };
            readonly required: readonly ["storeKey", "status"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly additionalProperties: true;
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresShippingOptions: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly productId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the Product being queried.";
                };
            };
            readonly required: readonly ["storeKey", "productId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly username: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If specified, use this user's shipping country when determining shipping options.";
                };
                readonly countryCode: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If no username is specified, use this country code when determining shipping options. Default is US.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of SellerShippingOptions to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of SellerShippingOptions to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly displayText: {
                                readonly type: "string";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresTopSalesSearch: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly categories: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly categoryId: {
                            readonly format: "int32";
                            readonly type: "integer";
                            readonly minimum: -2147483648;
                            readonly maximum: 2147483647;
                        };
                        readonly name: {
                            readonly type: "string";
                        };
                        readonly modifiedOn: {
                            readonly format: "date-time";
                            readonly type: "string";
                        };
                        readonly displayName: {
                            readonly type: "string";
                        };
                        readonly seoCategoryName: {
                            readonly type: "string";
                        };
                        readonly sealedLabel: {
                            readonly type: "string";
                        };
                        readonly nonSealedLabel: {
                            readonly type: "string";
                        };
                        readonly conditionGuideUrl: {
                            readonly type: "string";
                        };
                        readonly isScannable: {
                            readonly type: "boolean";
                        };
                        readonly popularity: {
                            readonly format: "int32";
                            readonly type: "integer";
                            readonly minimum: -2147483648;
                            readonly maximum: 2147483647;
                        };
                    };
                };
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
            };
            readonly required: readonly ["storeKey"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly includeGeneric: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, generic listings will be returned.  Default is true.";
                };
                readonly includeCustom: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "If set to true, custom listings will be returned.  Default is true.";
                };
                readonly offset: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The number of TopSoldProducts to skip. Default is 0.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Used for paging. The maximum number of TopSoldProducts to return. Default is 10.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly totalItems: {
                    readonly format: "int32";
                    readonly type: "integer";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                };
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly productId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly productName: {
                                readonly type: "string";
                            };
                            readonly setName: {
                                readonly type: "string";
                            };
                            readonly categoryName: {
                                readonly type: "string";
                            };
                            readonly rarity: {
                                readonly type: "string";
                            };
                            readonly number: {
                                readonly type: "string";
                            };
                            readonly lowestPrice: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly imageUrl: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresUpdateStoreBuylistSkuPrice: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly skuId: {
                readonly format: "int64";
                readonly type: "integer";
                readonly minimum: -9223372036854776000;
                readonly maximum: 9223372036854776000;
            };
            readonly price: {
                readonly format: "double";
                readonly type: "number";
                readonly minimum: -1.7976931348623157e+308;
                readonly maximum: 1.7976931348623157e+308;
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the SKU to update.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresUpdateStoreBuylistSkuQuantity: {
    readonly body: {
        readonly format: "int32";
        readonly type: "integer";
        readonly minimum: -2147483648;
        readonly maximum: 2147483647;
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the SKU to update.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresUpdateStoreSkuPrice: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly price: {
                readonly format: "double";
                readonly type: "number";
                readonly minimum: -1.7976931348623157e+308;
                readonly maximum: 1.7976931348623157e+308;
            };
            readonly channelId: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the SKU to update price for.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const StoresUpdateStoreSkuQuantity: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly quantity: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
            readonly channelId: {
                readonly format: "int32";
                readonly type: "integer";
                readonly minimum: -2147483648;
                readonly maximum: 2147483647;
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly storeKey: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. A unique key used to identify the caller of the API.";
                };
                readonly skuId: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Required. The Id of the SKU to update quantity for.";
                };
            };
            readonly required: readonly ["storeKey", "skuId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                };
                readonly errors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly skuId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly storePriceCustomId: {
                                readonly format: "int64";
                                readonly type: "integer";
                                readonly minimum: -9223372036854776000;
                                readonly maximum: 9223372036854776000;
                            };
                            readonly condition: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly conditionId: {
                                        readonly format: "int64";
                                        readonly type: "integer";
                                        readonly minimum: -9223372036854776000;
                                        readonly maximum: 9223372036854776000;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly language: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly languageId: {
                                        readonly format: "int32";
                                        readonly type: "integer";
                                        readonly minimum: -2147483648;
                                        readonly maximum: 2147483647;
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly abbr: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly foil: {
                                readonly type: "boolean";
                            };
                            readonly price: {
                                readonly format: "double";
                                readonly type: "number";
                                readonly minimum: -1.7976931348623157e+308;
                                readonly maximum: 1.7976931348623157e+308;
                            };
                            readonly quantity: {
                                readonly format: "int32";
                                readonly type: "integer";
                                readonly minimum: -2147483648;
                                readonly maximum: 2147483647;
                            };
                            readonly isFeatured: {
                                readonly type: "boolean";
                            };
                            readonly isCustom: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly mainImageUrl: {
                                readonly type: "string";
                            };
                            readonly additionalImageUrls: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { AppAuthorizeApplication, BuylistGetSellerBuylistInventory, CatalogGetCategories, CatalogGetCategory, CatalogGetCategoryConditions, CatalogGetCategoryGroups, CatalogGetCategoryLanguages, CatalogGetCategoryMedia, CatalogGetCategoryPrintings, CatalogGetCategoryRarities, CatalogGetCategorySearchManifest, CatalogGetConditions, CatalogGetGroup, CatalogGetGroupMedia, CatalogGetGroups, CatalogGetProduct, CatalogGetProductByGtin, CatalogGetProductMedia, CatalogGetProducts, CatalogGetProductsAlsoPurchasedByProductId, CatalogGetRecentSalesByProductId, CatalogGetRecentSalesBySkuId, CatalogGetSkus, CatalogGetSkusByProductId, CatalogSearchCategory, InventoryCreateProductList, InventoryGetProductList, InventoryGetProductListById, InventoryGetProductListByKey, MarketplaceClearMarketplaceCart, MarketplaceCreateInStorePickupPayLaterOrder, MarketplaceGetMarketplaceCart, MarketplaceGetMarketplaceCartByCartKey, MarketplaceReconcileCarts, MarketplaceUpdateMarketplaceCart, PricingGetGroupBuylistPrices, PricingGetGroupPrices, PricingGetMarketPriceByProductConditionId, PricingGetProductBuylistPrices, PricingGetProductConditionBuylistPrices, PricingGetProductConditionPrices, PricingGetProductPrices, StoresBatchUpdateStoreBuylistPrices, StoresBatchUpdateStoreSkuPrices, StoresCreateStoreBuylistSku, StoresCreateStoreOrderTracking, StoresCreateStoreSku, StoresFreeShippingOptions, StoresGetBuylistProductConditions, StoresGetBuylistProducts, StoresGetCustomListing, StoresGetIdentity, StoresGetInventoryProductQuantity, StoresGetInventorySkuPrice, StoresGetInventorySkuPrices, StoresGetInventorySkuQuantity, StoresGetProIdentity, StoresGetRelatedProducts, StoresGetSellerBuylistCategories, StoresGetSellerBuylistSets, StoresGetSellerBuylistSettings, StoresGetSkuBuylistPrice, StoresGetSkuBuylistPrices, StoresGetStoreAddress, StoresGetStoreCategories, StoresGetStoreChannels, StoresGetStoreCustomer, StoresGetStoreCustomerAddresses, StoresGetStoreCustomerOrderSummary, StoresGetStoreCustomers, StoresGetStoreFeedback, StoresGetStoreGroups, StoresGetStoreInventory, StoresGetStoreOrderFeedback, StoresGetStoreOrderLineItems, StoresGetStoreOrderManifest, StoresGetStoreOrderTracking, StoresGetStoreOrders, StoresGetStoreOrdersByOrderNumber, StoresGetStoreProductSkus, StoresGetStores, StoresGetStoresByStoreKey, StoresGetTopSalesForSeller, StoresProductSearchByCategory, StoresPutProIdentity, StoresSearchInventory, StoresSetStoreStatus, StoresShippingOptions, StoresTopSalesSearch, StoresUpdateStoreBuylistSkuPrice, StoresUpdateStoreBuylistSkuQuantity, StoresUpdateStoreSkuPrice, StoresUpdateStoreSkuQuantity };
