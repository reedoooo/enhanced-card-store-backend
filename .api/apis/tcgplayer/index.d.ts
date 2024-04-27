import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values: string[] | number[]): this;
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url: string, variables?: {}): void;
    /**
     * Create an application key based on an previously generated
     * authorization code.
     *
     * @summary Authorize an Application
     */
    app_AuthorizeApplication(metadata: types.AppAuthorizeApplicationMetadataParam): Promise<FetchResponse<200, types.AppAuthorizeApplicationResponse200>>;
    /**
     * Search Buylist Prices
     *
     */
    buylist_GetSellerBuylistInventory(metadata?: types.BuylistGetSellerBuylistInventoryMetadataParam): Promise<FetchResponse<200, types.BuylistGetSellerBuylistInventoryResponse200>>;
    /**
     * This endpoint returns a paged list of all categories supported by TCGplayer.
     *
     * @summary List All Categories
     */
    catalog_GetCategories(metadata?: types.CatalogGetCategoriesMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoriesResponse200>>;
    /**
     * This endpoint returns an array of categories whose Ids were specified in the
     * categoryIds parameter.  Categories that could be found are returned in the results
     * array in the response.  Categories that could not be found are indicated in the
     * errors array.
     *
     * @summary Get Category Details
     */
    catalog_GetCategory(metadata: types.CatalogGetCategoryMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryResponse200> | FetchResponse<207, types.CatalogGetCategoryResponse207>>;
    /**
     * This endpoint returns a search manifest for the specified category.  The search
     * manifest describes all of the sorting options and filters that are available for
     * this category. Its contents should be used to build requests to the POST
     * /catalog/categories/{categoryId}/search endpoint.
     *
     * @summary Get Category Search Manifest
     */
    catalog_GetCategorySearchManifest(metadata: types.CatalogGetCategorySearchManifestMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategorySearchManifestResponse200>>;
    /**
     * This endpoint returns an array of product Ids that match the provided search critera.
     * Use the search manifest from the GET /catalog/categories/{categoryId}/search/manifest
     * endpoint to build requests to this endpoint.  If an invalid filter name is specified
     * in the request, it will be ignored.  Use the GET /catalog/products/{productIds}
     * endpoint to get the details about the returned product Ids.
     *
     * @summary Search Category Products
     */
    catalog_SearchCategory(body: types.CatalogSearchCategoryBodyParam, metadata: types.CatalogSearchCategoryMetadataParam): Promise<FetchResponse<200, types.CatalogSearchCategoryResponse200>>;
    /**
     * This endpoint returns a paged list of all the groups associated with the specified
     * category.
     *
     * @summary List All Category Groups
     */
    catalog_GetCategoryGroups(metadata: types.CatalogGetCategoryGroupsMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryGroupsResponse200>>;
    /**
     * This endpoint returns all available rarities associated with the specified category.
     *
     * @summary List All Category Rarities
     */
    catalog_GetCategoryRarities(metadata: types.CatalogGetCategoryRaritiesMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryRaritiesResponse200>>;
    /**
     * This endpoint returns all available printings associated with the specified category.
     *
     * @summary List All Category Printings
     */
    catalog_GetCategoryPrintings(metadata: types.CatalogGetCategoryPrintingsMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryPrintingsResponse200>>;
    /**
     * This endpoint returns all available conditions associated with the specified
     * category.
     *
     * @summary List All Category Conditions
     */
    catalog_GetCategoryConditions(metadata: types.CatalogGetCategoryConditionsMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryConditionsResponse200>>;
    /**
     * This endpoint returns all available languages associated with the specified category.
     *
     * @summary List All Category Languages
     */
    catalog_GetCategoryLanguages(metadata: types.CatalogGetCategoryLanguagesMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryLanguagesResponse200>>;
    /**
     * This endpoint returns all available media (e.g. images) associated with the specified
     * category.
     *
     * @summary List All Category Media
     */
    catalog_GetCategoryMedia(metadata: types.CatalogGetCategoryMediaMetadataParam): Promise<FetchResponse<200, types.CatalogGetCategoryMediaResponse200>>;
    /**
     * This endpoint returns all groups that match the specified criteria.
     *
     * @summary List All Groups Details
     */
    catalog_GetGroups(metadata?: types.CatalogGetGroupsMetadataParam): Promise<FetchResponse<200, types.CatalogGetGroupsResponse200>>;
    /**
     * This endpoint returns an array of groups whose Ids were specified in the groupIds
     * parameter.  Groups that could be found are returned in the results array in the
     * response.  Groups that could not be found are indicated in the errors array.
     *
     * @summary Get Group Details
     */
    catalog_GetGroup(metadata: types.CatalogGetGroupMetadataParam): Promise<FetchResponse<200, types.CatalogGetGroupResponse200> | FetchResponse<207, types.CatalogGetGroupResponse207>>;
    /**
     * This endpoint returns all available media (e.g. images) associated with the
     * specified group.
     *
     * @summary List All Group Media
     */
    catalog_GetGroupMedia(metadata: types.CatalogGetGroupMediaMetadataParam): Promise<FetchResponse<200, types.CatalogGetGroupMediaResponse200>>;
    /**
     * This endpoint returns all products that match the specified criteria.
     *
     * @summary List All Products
     */
    catalog_GetProducts(metadata?: types.CatalogGetProductsMetadataParam): Promise<FetchResponse<200, types.CatalogGetProductsResponse200>>;
    /**
     * This endpoint returns an array of products whose Ids were specified in the productIds
     * parameter.  Products that could be found are returned in the results array in the
     * response.  Products that could not be found are indicated in the errors array.
     *
     * @summary Get Product Details
     */
    catalog_GetProduct(metadata: types.CatalogGetProductMetadataParam): Promise<FetchResponse<200, types.CatalogGetProductResponse200> | FetchResponse<207, types.CatalogGetProductResponse207>>;
    /**
     * This endpoint returns a Product's details using a code from the GTIN family of
     * product codes. NOTE: Not all products will have a GTIN.
     *
     * @summary Get Product Details By GTIN
     */
    catalog_GetProductByGtin(metadata: types.CatalogGetProductByGtinMetadataParam): Promise<FetchResponse<200, types.CatalogGetProductByGtinResponse200>>;
    /**
     * This endpoint returns all of the available SKUs for the specified product.
     *
     * @summary List Product SKUs
     */
    catalog_GetSkusByProductId(metadata: types.CatalogGetSkusByProductIdMetadataParam): Promise<FetchResponse<200, types.CatalogGetSkusByProductIdResponse200>>;
    /**
     * This endpoint returns the most recent sales for the specified product.  The sales
     * data returns is sorted from most recent to least recent.
     *
     * @summary List Recent Product Sales
     */
    catalog_GetRecentSalesByProductId(metadata: types.CatalogGetRecentSalesByProductIdMetadataParam): Promise<FetchResponse<200, types.CatalogGetRecentSalesByProductIdResponse200>>;
    /**
     * Returns other products that are commonly found in the same orders as the specified
     * anchor product.
     *
     * @summary List Related Products
     */
    catalog_GetProductsAlsoPurchasedByProductId(metadata: types.CatalogGetProductsAlsoPurchasedByProductIdMetadataParam): Promise<FetchResponse<200, types.CatalogGetProductsAlsoPurchasedByProductIdResponse200>>;
    /**
     * Returns all available media (e.g. images) associated with the specified product.
     *
     * @summary List All Product Media Types
     */
    catalog_GetProductMedia(metadata: types.CatalogGetProductMediaMetadataParam): Promise<FetchResponse<200, types.CatalogGetProductMediaResponse200>>;
    /**
     * This endpoint returns the most recent sales for the specified SKU.  The sales data
     * returns is sorted from most recent to least recent.
     *
     * @summary List Recent SKU Sales
     */
    catalog_GetRecentSalesBySkuId(metadata: types.CatalogGetRecentSalesBySkuIdMetadataParam): Promise<FetchResponse<200, types.CatalogGetRecentSalesBySkuIdResponse200>>;
    /**
     * This endpoint returns an array of SKUs whose Ids were specified in the skuIds
     * parameter.  SKUs that could be found are returned in the results array in the
     * response.  SKUs that could not be found are indicated in the errors array.
     *
     * @summary Get SKU details
     */
    catalog_GetSkus(metadata: types.CatalogGetSkusMetadataParam): Promise<FetchResponse<200, types.CatalogGetSkusResponse200> | FetchResponse<207, types.CatalogGetSkusResponse207>>;
    /**
     * This endpoint returns an array contain all of the normalized conditions
     * supported by TCGplayer, e.g. Near Mint, Lightly Played.
     *
     * @summary List Conditions
     */
    catalog_GetConditions(): Promise<FetchResponse<200, types.CatalogGetConditionsResponse200>>;
    /**
     * Returns the ProductList specified by using the ProductListId.
     *
     * @summary Get ProductList By Id
     */
    inventory_GetProductListById(metadata: types.InventoryGetProductListByIdMetadataParam): Promise<FetchResponse<200, types.InventoryGetProductListByIdResponse200>>;
    /**
     * Returns the ProductList specified by using the ProductListKey.
     *
     * @summary Get ProductList By Key
     */
    inventory_GetProductListByKey(metadata: types.InventoryGetProductListByKeyMetadataParam): Promise<FetchResponse<200, types.InventoryGetProductListByKeyResponse200>>;
    /**
     * This lists all the accessible ProductLists to the user identified in the bearer token
     * making the API call.
     *
     * @summary List All ProductLists
     */
    inventory_GetProductList(): Promise<FetchResponse<200, types.InventoryGetProductListResponse200>>;
    /**
     * Create ProductList
     *
     */
    inventory_CreateProductList(body: types.InventoryCreateProductListBodyParam): Promise<FetchResponse<200, types.InventoryCreateProductListResponse200>>;
    /**
     * Gets the current shopping cart of the user specified in the bearer token making this API
     * call.
     *
     * @summary Get Current Shopping Cart
     */
    marketplace_GetMarketplaceCart(): Promise<FetchResponse<200, types.MarketplaceGetMarketplaceCartResponse200>>;
    /**
     * Updates the current shopping cart of the user specified in the bearer token making this
     * API call.
     *
     * @summary Update Current Shopping Cart
     */
    marketplace_UpdateMarketplaceCart(body: types.MarketplaceUpdateMarketplaceCartBodyParam, metadata?: types.MarketplaceUpdateMarketplaceCartMetadataParam): Promise<FetchResponse<200, types.MarketplaceUpdateMarketplaceCartResponse200>>;
    /**
     * Gets the shopping cart associated with the specified key.
     *
     * @summary Get Shopping Cart
     */
    marketplace_GetMarketplaceCartByCartKey(metadata: types.MarketplaceGetMarketplaceCartByCartKeyMetadataParam): Promise<FetchResponse<200, types.MarketplaceGetMarketplaceCartByCartKeyResponse200>>;
    /**
     * Clears the contents of the specified shopping cart.
     *
     * @summary Clear Shopping Cart
     */
    marketplace_ClearMarketplaceCart(metadata: types.MarketplaceClearMarketplaceCartMetadataParam): Promise<FetchResponse<200, types.MarketplaceClearMarketplaceCartResponse200>>;
    /**
     * Combines the shopping cart associated with the specified key with the current shopping
     * cart of the user specified in the bearer token making this API call.
     *
     * @summary Merge Shopping Carts
     */
    marketplace_ReconcileCarts(metadata: types.MarketplaceReconcileCartsMetadataParam): Promise<FetchResponse<200, types.MarketplaceReconcileCartsResponse200>>;
    /**
     * Converts a shopping cart into an order
     *
     * @summary Create In-Store Pickup Pay Later Order
     */
    marketplace_CreateInStorePickupPayLaterOrder(body: types.MarketplaceCreateInStorePickupPayLaterOrderBodyParam): Promise<FetchResponse<200, types.MarketplaceCreateInStorePickupPayLaterOrderResponse200>>;
    /**
     * Gets the current Market Price for the specified SKU.
     *
     * @summary Get Market Price by SKU
     */
    pricing_GetMarketPriceByProductConditionId(metadata: types.PricingGetMarketPriceByProductConditionIdMetadataParam): Promise<FetchResponse<200, types.PricingGetMarketPriceByProductConditionIdResponse200>>;
    /**
     * Returns all product prices associated with the specified Group.
     *
     * @summary List Product Prices by Group
     */
    pricing_GetGroupPrices(metadata: types.PricingGetGroupPricesMetadataParam): Promise<FetchResponse<200, types.PricingGetGroupPricesResponse200>>;
    /**
     * Returns all product market prices for the Ids specified.  Market prices that could
     * be found are returned in the results array in the response.  Market prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List Product Market Prices
     */
    pricing_GetProductPrices(metadata: types.PricingGetProductPricesMetadataParam): Promise<FetchResponse<200, types.PricingGetProductPricesResponse200> | FetchResponse<207, types.PricingGetProductPricesResponse207>>;
    /**
     * Returns all SKU market prices for the Ids specified.  Market prices that could
     * be found are returned in the results array in the response.  Market prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List SKU Market Prices
     */
    pricing_GetProductConditionPrices(metadata: types.PricingGetProductConditionPricesMetadataParam): Promise<FetchResponse<200, types.PricingGetProductConditionPricesResponse200> | FetchResponse<207, types.PricingGetProductConditionPricesResponse207>>;
    /**
     * Returns all product buylist prices for the Ids specified.  Buylist prices that could
     * be found are returned in the results array in the response.  Buylist prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List Product Buylist Prices
     */
    pricing_GetProductBuylistPrices(metadata: types.PricingGetProductBuylistPricesMetadataParam): Promise<FetchResponse<200, types.PricingGetProductBuylistPricesResponse200> | FetchResponse<207, types.PricingGetProductBuylistPricesResponse207>>;
    /**
     * Returns all SKU buylist prices for the Ids specified.  Buylist prices that could
     * be found are returned in the results array in the response.  Buylist prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List SKU Buylist Prices
     */
    pricing_GetProductConditionBuylistPrices(metadata: types.PricingGetProductConditionBuylistPricesMetadataParam): Promise<FetchResponse<200, types.PricingGetProductConditionBuylistPricesResponse200> | FetchResponse<207, types.PricingGetProductConditionBuylistPricesResponse207>>;
    /**
     * Returns all product buylist prices associated with the specified Group.
     *
     * @summary List Product Buylist Prices by Group
     */
    pricing_GetGroupBuylistPrices(metadata: types.PricingGetGroupBuylistPricesMetadataParam): Promise<FetchResponse<200, types.PricingGetGroupBuylistPricesResponse200>>;
    /**
     * Get Store Settings
     *
     */
    stores_GetProIdentity(metadata: types.StoresGetProIdentityMetadataParam): Promise<FetchResponse<200, types.StoresGetProIdentityResponse200>>;
    /**
     * Update Store Settings
     *
     */
    stores_PutProIdentity(body: types.StoresPutProIdentityBodyParam, metadata: types.StoresPutProIdentityMetadataParam): Promise<FetchResponse<200, types.StoresPutProIdentityResponse200>>;
    /**
     * Get SKU Buylist Price.
     *
     * @summary Get SKU Buylist Price
     */
    stores_GetSkuBuylistPrice(metadata: types.StoresGetSkuBuylistPriceMetadataParam): Promise<FetchResponse<200, types.StoresGetSkuBuylistPriceResponse200>>;
    /**
     * List SKU Buylist Price
     *
     * @summary List SKU Buylist Price
     */
    stores_GetSkuBuylistPrices(metadata: types.StoresGetSkuBuylistPricesMetadataParam): Promise<FetchResponse<200, types.StoresGetSkuBuylistPricesResponse200>>;
    /**
     * Perform multiple buylist updates asynchronously in a batch.  The response will
     * contain a single GUID to identify the batch.  All buylist updates are applied
     * to the buylist of the seller indicated by the bearer token used to make this
     * request. When the batch has been processed, a message will be sent to your
     * application's web hook containing the GUID from this response.
     *
     * @summary Batch Update Store Buylist Prices
     */
    stores_BatchUpdateStoreBuylistPrices(body: types.StoresBatchUpdateStoreBuylistPricesBodyParam, metadata: types.StoresBatchUpdateStoreBuylistPricesMetadataParam): Promise<FetchResponse<200, types.StoresBatchUpdateStoreBuylistPricesResponse200>>;
    /**
     * Create SKU Buylist
     *
     */
    stores_CreateStoreBuylistSku(body: types.StoresCreateStoreBuylistSkuBodyParam, metadata: types.StoresCreateStoreBuylistSkuMetadataParam): Promise<FetchResponse<200, types.StoresCreateStoreBuylistSkuResponse200>>;
    /**
     * Update SKU Buylist Price
     *
     */
    stores_UpdateStoreBuylistSkuPrice(body: types.StoresUpdateStoreBuylistSkuPriceBodyParam, metadata: types.StoresUpdateStoreBuylistSkuPriceMetadataParam): Promise<FetchResponse<200, types.StoresUpdateStoreBuylistSkuPriceResponse200>>;
    /**
     * Update SKU Buylist Quantity
     *
     */
    stores_UpdateStoreBuylistSkuQuantity(body: types.StoresUpdateStoreBuylistSkuQuantityBodyParam, metadata: types.StoresUpdateStoreBuylistSkuQuantityMetadataParam): Promise<FetchResponse<200, types.StoresUpdateStoreBuylistSkuQuantityResponse200>>;
    /**
     * Get Buylist Categories
     *
     */
    stores_GetSellerBuylistCategories(metadata: types.StoresGetSellerBuylistCategoriesMetadataParam): Promise<FetchResponse<200, types.StoresGetSellerBuylistCategoriesResponse200>>;
    /**
     * Get Buylist Groups
     *
     */
    stores_GetSellerBuylistSets(metadata: types.StoresGetSellerBuylistSetsMetadataParam): Promise<FetchResponse<200, types.StoresGetSellerBuylistSetsResponse200>>;
    /**
     * Get Store Buylist Settings
     *
     */
    stores_GetSellerBuylistSettings(metadata: types.StoresGetSellerBuylistSettingsMetadataParam): Promise<FetchResponse<200, types.StoresGetSellerBuylistSettingsResponse200>>;
    /**
     * Get a Store's Buylist Products for Kiosk use.
     *
     */
    stores_GetBuylistProducts(metadata: types.StoresGetBuylistProductsMetadataParam): Promise<FetchResponse<200, types.StoresGetBuylistProductsResponse200>>;
    /**
     * Get the Product Conditions for a Product on a Store's Buylist.
     *
     */
    stores_GetBuylistProductConditions(metadata: types.StoresGetBuylistProductConditionsMetadataParam): Promise<FetchResponse<200, types.StoresGetBuylistProductConditionsResponse200>>;
    /**
     * Returns a collection of storeKey values based on the search parameters.
     *
     * @summary Search Stores
     */
    stores_GetStores(metadata?: types.StoresGetStoresMetadataParam): Promise<FetchResponse<200, types.StoresGetStoresResponse200>>;
    /**
     * Gets the current Store's Free Shipping option (if exists) whose Seller is associated
     * with the user's bearer token making this API call.
     *
     * @summary Get Free Shipping Option
     */
    stores_FreeShippingOptions(metadata: types.StoresFreeShippingOptionsMetadataParam): Promise<FetchResponse<200, types.StoresFreeShippingOptionsResponse200>>;
    /**
     * Return address information about the Store specified by the storeKey.
     *
     * @summary Get Store Address
     */
    stores_GetStoreAddress(metadata: types.StoresGetStoreAddressMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreAddressResponse200>>;
    /**
     * Return feedback information about the Store specified by the storeKey.
     *
     * @summary Get Store Feedback
     */
    stores_GetStoreFeedback(metadata: types.StoresGetStoreFeedbackMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreFeedbackResponse200>>;
    /**
     * If a store's status is either Live or Hold - User Request then this action may be called
     * to flip the store between the
     * two.  When the store is Live, it's inventory is visible in the marketplace.  When the
     * store is not Live, it's inventory
     * is hidden from the marketplace.  Stores may voluntarily hide their inventory by
     * switching their status to Hold - User
     * Request.  There are other statuses that TCGplayer can put the store in that wil cause
     * it's inventory to be hidden from
     * the marketplace.  Stores cannot put themselves in or take themselves out of these
     * statuses.  Only a TCGplayer admin or
     * customer service rep can interact with stores with these statuses.
     *
     * @summary Set Store Status
     */
    stores_SetStoreStatus(metadata: types.StoresSetStoreStatusMetadataParam): Promise<FetchResponse<200, types.StoresSetStoreStatusResponse200>>;
    /**
     * Returns the total number of orders and total product dollar amount for all orders a
     * customer has place with the seller.
     * The token represents the unique seller and customer combination.
     *
     * @summary Get Customer Summary
     */
    stores_GetStoreCustomer(metadata: types.StoresGetStoreCustomerMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreCustomerResponse200>>;
    /**
     * Search Store Customers.
     *
     * @summary Search Store Customers
     */
    stores_GetStoreCustomers(metadata: types.StoresGetStoreCustomersMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreCustomersResponse200>>;
    /**
     * Returns the shipping addresses associated with the orders a customer has placed with the
     * seller.
     * The token represents the unique seller and customer combination.
     *
     * @summary Get Customer Addresses
     */
    stores_GetStoreCustomerAddresses(metadata: types.StoresGetStoreCustomerAddressesMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreCustomerAddressesResponse200>>;
    /**
     * Returns a list of orders containing the total product quantity and total product dollar
     * amount for each order a customer has placed with the seller.
     * The token represents the unique seller and customer combination.
     *
     * @summary Get Customer Orders
     */
    stores_GetStoreCustomerOrderSummary(metadata: types.StoresGetStoreCustomerOrderSummaryMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreCustomerOrderSummaryResponse200>>;
    /**
     * Return general information about the current Store associated with the current bearer
     * token.
     *
     * @summary Get Store Info
     */
    stores_GetIdentity(): Promise<FetchResponse<200, types.StoresGetIdentityResponse200>>;
    /**
     * Return general information about the stores specified by the store keys.
     *
     * @summary Get Store Info
     */
    stores_GetStoresByStoreKey(metadata: types.StoresGetStoresByStoreKeyMetadataParam): Promise<FetchResponse<200, types.StoresGetStoresByStoreKeyResponse200>>;
    /**
     * Get Product Inventory Quantities.
     *
     * @summary Get Product Inventory Quantities
     */
    stores_GetInventoryProductQuantity(metadata: types.StoresGetInventoryProductQuantityMetadataParam): Promise<FetchResponse<200, types.StoresGetInventoryProductQuantityResponse200>>;
    /**
     * List Product Summary.
     *
     * @summary List Product Summary
     */
    stores_GetStoreInventory(metadata: types.StoresGetStoreInventoryMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreInventoryResponse200>>;
    /**
     * List Product SKUs
     *
     */
    stores_GetStoreProductSkus(metadata: types.StoresGetStoreProductSkusMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreProductSkusResponse200>>;
    /**
     * Related Products are other Products that are often purchased along with the specified
     * Product.
     *
     * @summary List Related Products
     */
    stores_GetRelatedProducts(metadata: types.StoresGetRelatedProductsMetadataParam): Promise<FetchResponse<200, types.StoresGetRelatedProductsResponse200>>;
    /**
     * List Shipping Options
     *
     */
    stores_ShippingOptions(metadata: types.StoresShippingOptionsMetadataParam): Promise<FetchResponse<200, types.StoresShippingOptionsResponse200>>;
    /**
     * Get SKU Quantity.
     *
     * @summary Get SKU Quantity
     */
    stores_GetInventorySkuQuantity(metadata: types.StoresGetInventorySkuQuantityMetadataParam): Promise<FetchResponse<200, types.StoresGetInventorySkuQuantityResponse200>>;
    /**
     * Increments the current store's inventory of this SKU from the current Store's inventory
     * whose Seller is associated with the user's bearer token making this API call.
     *
     * @summary Increment SKU Inventory Quantity
     */
    stores_UpdateStoreSkuQuantity(body: types.StoresUpdateStoreSkuQuantityBodyParam, metadata: types.StoresUpdateStoreSkuQuantityMetadataParam): Promise<FetchResponse<200, types.StoresUpdateStoreSkuQuantityResponse200>>;
    /**
     * Adds or updates a SKU to the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary Update SKU inventory
     */
    stores_CreateStoreSku(body: types.StoresCreateStoreSkuBodyParam, metadata: types.StoresCreateStoreSkuMetadataParam): Promise<FetchResponse<200, types.StoresCreateStoreSkuResponse200>>;
    /**
     * Perform multiple price updates asynchronously in a batch.  The response will contain a
     * single GUID to identify the batch.  All price updates
     * are applied to the inventory of the seller indicated by the bearer token used to make
     * this request. When the batch has been processed, a message
     * will be sent to your application's web hook containing the GUID from this response.
     *
     * @summary Batch Update Store Sku Prices
     */
    stores_BatchUpdateStoreSkuPrices(body: types.StoresBatchUpdateStoreSkuPricesBodyParam, metadata: types.StoresBatchUpdateStoreSkuPricesMetadataParam): Promise<FetchResponse<200, types.StoresBatchUpdateStoreSkuPricesResponse200>>;
    /**
     * Updates the current store's pricing of this SKU from the current Store's inventory whose
     * Seller is associated with the user's bearer token making this API call.
     *
     * @summary Update SKU Inventory Price
     */
    stores_UpdateStoreSkuPrice(body: types.StoresUpdateStoreSkuPriceBodyParam, metadata: types.StoresUpdateStoreSkuPriceMetadataParam): Promise<FetchResponse<200, types.StoresUpdateStoreSkuPriceResponse200>>;
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary List SKU List Price
     */
    stores_GetInventorySkuPrices(metadata: types.StoresGetInventorySkuPricesMetadataParam): Promise<FetchResponse<200, types.StoresGetInventorySkuPricesResponse200>>;
    /**
     * Get SKU List Price.
     *
     * @summary Get SKU List Price
     */
    stores_GetInventorySkuPrice(metadata: types.StoresGetInventorySkuPriceMetadataParam): Promise<FetchResponse<200, types.StoresGetInventorySkuPriceResponse200>>;
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary List All Groups
     */
    stores_GetStoreGroups(metadata: types.StoresGetStoreGroupsMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreGroupsResponse200>>;
    /**
     * List All Categories.
     *
     * @summary List All Categories.
     */
    stores_GetStoreCategories(metadata: types.StoresGetStoreCategoriesMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreCategoriesResponse200>>;
    /**
     * List all products based on criteria
     *
     * @summary List Product Summary By Category
     */
    stores_ProductSearchByCategory(body: types.StoresProductSearchByCategoryBodyParam, metadata: types.StoresProductSearchByCategoryMetadataParam): Promise<FetchResponse<200, types.StoresProductSearchByCategoryResponse200>>;
    /**
     * List All Channels for a Store.
     *
     * @summary List Store Channels
     */
    stores_GetStoreChannels(metadata: types.StoresGetStoreChannelsMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreChannelsResponse200>>;
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary List Top Sold Products
     */
    stores_GetTopSalesForSeller(metadata: types.StoresGetTopSalesForSellerMetadataParam): Promise<FetchResponse<200, types.StoresGetTopSalesForSellerResponse200>>;
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     * Similar to the other Top Sales Search except that you can specify search criteria in the
     * sellerTssc parameter.
     *
     * @summary Search Top Sold Products
     */
    stores_TopSalesSearch(body: types.StoresTopSalesSearchBodyParam, metadata: types.StoresTopSalesSearchMetadataParam): Promise<FetchResponse<200, types.StoresTopSalesSearchResponse200>>;
    /**
     * SearchResults returned can include Product, Groups, and Categories.
     *
     * @summary List Catalog Objects
     */
    stores_SearchInventory(metadata: types.StoresSearchInventoryMetadataParam): Promise<FetchResponse<200, types.StoresSearchInventoryResponse200>>;
    /**
     * Retrieves the custom listing by the criteria passed in the querystring.
     *
     * @summary Search Custom Listings.
     */
    stores_GetCustomListing(metadata: types.StoresGetCustomListingMetadataParam): Promise<FetchResponse<200, types.StoresGetCustomListingResponse200>>;
    /**
     * Get Order Manifest.
     *
     * @summary Get Order Manifest
     */
    stores_GetStoreOrderManifest(metadata: types.StoresGetStoreOrderManifestMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreOrderManifestResponse200>>;
    /**
     * Get Order Details.
     *
     * @summary Get Order Details
     */
    stores_GetStoreOrdersByOrderNumber(metadata: types.StoresGetStoreOrdersByOrderNumberMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreOrdersByOrderNumberResponse200>>;
    /**
     * Get Order Feedback.
     *
     * @summary Get Order Feedback
     */
    stores_GetStoreOrderFeedback(metadata: types.StoresGetStoreOrderFeedbackMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreOrderFeedbackResponse200>>;
    /**
     * Search Orders.
     *
     * @summary Search Orders
     */
    stores_GetStoreOrders(metadata: types.StoresGetStoreOrdersMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreOrdersResponse200>>;
    /**
     * Get Order Items.
     *
     * @summary Get Order Items
     */
    stores_GetStoreOrderLineItems(metadata: types.StoresGetStoreOrderLineItemsMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreOrderLineItemsResponse200>>;
    /**
     * Get Order Tracking Numbers.
     *
     * @summary Get Order Tracking Numbers
     */
    stores_GetStoreOrderTracking(metadata: types.StoresGetStoreOrderTrackingMetadataParam): Promise<FetchResponse<200, types.StoresGetStoreOrderTrackingResponse200>>;
    /**
     * Add Order Tracking Number.
     *
     * @summary Add Order Tracking Number
     */
    stores_CreateStoreOrderTracking(body: types.StoresCreateStoreOrderTrackingBodyParam, metadata: types.StoresCreateStoreOrderTrackingMetadataParam): Promise<FetchResponse<200, types.StoresCreateStoreOrderTrackingResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
