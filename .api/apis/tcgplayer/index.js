"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'tcgplayer/v1.39.0 (api/6.1.1)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
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
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
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
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Create an application key based on an previously generated
     * authorization code.
     *
     * @summary Authorize an Application
     */
    SDK.prototype.app_AuthorizeApplication = function (metadata) {
        return this.core.fetch('/app/authorize/{authCode}', 'post', metadata);
    };
    /**
     * Search Buylist Prices
     *
     */
    SDK.prototype.buylist_GetSellerBuylistInventory = function (metadata) {
        return this.core.fetch('/buylist/pricing', 'get', metadata);
    };
    /**
     * This endpoint returns a paged list of all categories supported by TCGplayer.
     *
     * @summary List All Categories
     */
    SDK.prototype.catalog_GetCategories = function (metadata) {
        return this.core.fetch('/catalog/categories', 'get', metadata);
    };
    /**
     * This endpoint returns an array of categories whose Ids were specified in the
     * categoryIds parameter.  Categories that could be found are returned in the results
     * array in the response.  Categories that could not be found are indicated in the
     * errors array.
     *
     * @summary Get Category Details
     */
    SDK.prototype.catalog_GetCategory = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryIds}', 'get', metadata);
    };
    /**
     * This endpoint returns a search manifest for the specified category.  The search
     * manifest describes all of the sorting options and filters that are available for
     * this category. Its contents should be used to build requests to the POST
     * /catalog/categories/{categoryId}/search endpoint.
     *
     * @summary Get Category Search Manifest
     */
    SDK.prototype.catalog_GetCategorySearchManifest = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/search/manifest', 'get', metadata);
    };
    /**
     * This endpoint returns an array of product Ids that match the provided search critera.
     * Use the search manifest from the GET /catalog/categories/{categoryId}/search/manifest
     * endpoint to build requests to this endpoint.  If an invalid filter name is specified
     * in the request, it will be ignored.  Use the GET /catalog/products/{productIds}
     * endpoint to get the details about the returned product Ids.
     *
     * @summary Search Category Products
     */
    SDK.prototype.catalog_SearchCategory = function (body, metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/search', 'post', body, metadata);
    };
    /**
     * This endpoint returns a paged list of all the groups associated with the specified
     * category.
     *
     * @summary List All Category Groups
     */
    SDK.prototype.catalog_GetCategoryGroups = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/groups', 'get', metadata);
    };
    /**
     * This endpoint returns all available rarities associated with the specified category.
     *
     * @summary List All Category Rarities
     */
    SDK.prototype.catalog_GetCategoryRarities = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/rarities', 'get', metadata);
    };
    /**
     * This endpoint returns all available printings associated with the specified category.
     *
     * @summary List All Category Printings
     */
    SDK.prototype.catalog_GetCategoryPrintings = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/printings', 'get', metadata);
    };
    /**
     * This endpoint returns all available conditions associated with the specified
     * category.
     *
     * @summary List All Category Conditions
     */
    SDK.prototype.catalog_GetCategoryConditions = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/conditions', 'get', metadata);
    };
    /**
     * This endpoint returns all available languages associated with the specified category.
     *
     * @summary List All Category Languages
     */
    SDK.prototype.catalog_GetCategoryLanguages = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/languages', 'get', metadata);
    };
    /**
     * This endpoint returns all available media (e.g. images) associated with the specified
     * category.
     *
     * @summary List All Category Media
     */
    SDK.prototype.catalog_GetCategoryMedia = function (metadata) {
        return this.core.fetch('/catalog/categories/{categoryId}/media', 'get', metadata);
    };
    /**
     * This endpoint returns all groups that match the specified criteria.
     *
     * @summary List All Groups Details
     */
    SDK.prototype.catalog_GetGroups = function (metadata) {
        return this.core.fetch('/catalog/groups', 'get', metadata);
    };
    /**
     * This endpoint returns an array of groups whose Ids were specified in the groupIds
     * parameter.  Groups that could be found are returned in the results array in the
     * response.  Groups that could not be found are indicated in the errors array.
     *
     * @summary Get Group Details
     */
    SDK.prototype.catalog_GetGroup = function (metadata) {
        return this.core.fetch('/catalog/groups/{groupIds}', 'get', metadata);
    };
    /**
     * This endpoint returns all available media (e.g. images) associated with the
     * specified group.
     *
     * @summary List All Group Media
     */
    SDK.prototype.catalog_GetGroupMedia = function (metadata) {
        return this.core.fetch('/catalog/groups/{groupId}/media', 'get', metadata);
    };
    /**
     * This endpoint returns all products that match the specified criteria.
     *
     * @summary List All Products
     */
    SDK.prototype.catalog_GetProducts = function (metadata) {
        return this.core.fetch('/catalog/products', 'get', metadata);
    };
    /**
     * This endpoint returns an array of products whose Ids were specified in the productIds
     * parameter.  Products that could be found are returned in the results array in the
     * response.  Products that could not be found are indicated in the errors array.
     *
     * @summary Get Product Details
     */
    SDK.prototype.catalog_GetProduct = function (metadata) {
        return this.core.fetch('/catalog/products/{productIds}', 'get', metadata);
    };
    /**
     * This endpoint returns a Product's details using a code from the GTIN family of
     * product codes. NOTE: Not all products will have a GTIN.
     *
     * @summary Get Product Details By GTIN
     */
    SDK.prototype.catalog_GetProductByGtin = function (metadata) {
        return this.core.fetch('/catalog/products/gtin/{gtin}', 'get', metadata);
    };
    /**
     * This endpoint returns all of the available SKUs for the specified product.
     *
     * @summary List Product SKUs
     */
    SDK.prototype.catalog_GetSkusByProductId = function (metadata) {
        return this.core.fetch('/catalog/products/{productId}/skus', 'get', metadata);
    };
    /**
     * This endpoint returns the most recent sales for the specified product.  The sales
     * data returns is sorted from most recent to least recent.
     *
     * @summary List Recent Product Sales
     */
    SDK.prototype.catalog_GetRecentSalesByProductId = function (metadata) {
        return this.core.fetch('/catalog/products/{productId}/recentsales', 'get', metadata);
    };
    /**
     * Returns other products that are commonly found in the same orders as the specified
     * anchor product.
     *
     * @summary List Related Products
     */
    SDK.prototype.catalog_GetProductsAlsoPurchasedByProductId = function (metadata) {
        return this.core.fetch('/catalog/products/{productId}/productsalsopurchased', 'get', metadata);
    };
    /**
     * Returns all available media (e.g. images) associated with the specified product.
     *
     * @summary List All Product Media Types
     */
    SDK.prototype.catalog_GetProductMedia = function (metadata) {
        return this.core.fetch('/catalog/products/{productId}/media', 'get', metadata);
    };
    /**
     * This endpoint returns the most recent sales for the specified SKU.  The sales data
     * returns is sorted from most recent to least recent.
     *
     * @summary List Recent SKU Sales
     */
    SDK.prototype.catalog_GetRecentSalesBySkuId = function (metadata) {
        return this.core.fetch('/catalog/skus/{skuId}/recentsales', 'get', metadata);
    };
    /**
     * This endpoint returns an array of SKUs whose Ids were specified in the skuIds
     * parameter.  SKUs that could be found are returned in the results array in the
     * response.  SKUs that could not be found are indicated in the errors array.
     *
     * @summary Get SKU details
     */
    SDK.prototype.catalog_GetSkus = function (metadata) {
        return this.core.fetch('/catalog/skus/{skuIds}', 'get', metadata);
    };
    /**
     * This endpoint returns an array contain all of the normalized conditions
     * supported by TCGplayer, e.g. Near Mint, Lightly Played.
     *
     * @summary List Conditions
     */
    SDK.prototype.catalog_GetConditions = function () {
        return this.core.fetch('/catalog/conditions', 'get');
    };
    /**
     * Returns the ProductList specified by using the ProductListId.
     *
     * @summary Get ProductList By Id
     */
    SDK.prototype.inventory_GetProductListById = function (metadata) {
        return this.core.fetch('/inventory/productlists/{productListId}', 'get', metadata);
    };
    /**
     * Returns the ProductList specified by using the ProductListKey.
     *
     * @summary Get ProductList By Key
     */
    SDK.prototype.inventory_GetProductListByKey = function (metadata) {
        return this.core.fetch('/inventory/productlists/{productListKey}', 'get', metadata);
    };
    /**
     * This lists all the accessible ProductLists to the user identified in the bearer token
     * making the API call.
     *
     * @summary List All ProductLists
     */
    SDK.prototype.inventory_GetProductList = function () {
        return this.core.fetch('/inventory/productLists', 'get');
    };
    /**
     * Create ProductList
     *
     */
    SDK.prototype.inventory_CreateProductList = function (body) {
        return this.core.fetch('/inventory/productLists', 'post', body);
    };
    /**
     * Gets the current shopping cart of the user specified in the bearer token making this API
     * call.
     *
     * @summary Get Current Shopping Cart
     */
    SDK.prototype.marketplace_GetMarketplaceCart = function () {
        return this.core.fetch('/marketplace/shop/carts', 'get');
    };
    /**
     * Updates the current shopping cart of the user specified in the bearer token making this
     * API call.
     *
     * @summary Update Current Shopping Cart
     */
    SDK.prototype.marketplace_UpdateMarketplaceCart = function (body, metadata) {
        return this.core.fetch('/marketplace/shop/carts', 'post', body, metadata);
    };
    /**
     * Gets the shopping cart associated with the specified key.
     *
     * @summary Get Shopping Cart
     */
    SDK.prototype.marketplace_GetMarketplaceCartByCartKey = function (metadata) {
        return this.core.fetch('/marketplace/shop/carts/{cartKey}', 'get', metadata);
    };
    /**
     * Clears the contents of the specified shopping cart.
     *
     * @summary Clear Shopping Cart
     */
    SDK.prototype.marketplace_ClearMarketplaceCart = function (metadata) {
        return this.core.fetch('/marketplace/shop/carts/{cartKey}/clear', 'post', metadata);
    };
    /**
     * Combines the shopping cart associated with the specified key with the current shopping
     * cart of the user specified in the bearer token making this API call.
     *
     * @summary Merge Shopping Carts
     */
    SDK.prototype.marketplace_ReconcileCarts = function (metadata) {
        return this.core.fetch('/marketplace/shop/carts/{cartKey}/reconcile', 'post', metadata);
    };
    /**
     * Converts a shopping cart into an order
     *
     * @summary Create In-Store Pickup Pay Later Order
     */
    SDK.prototype.marketplace_CreateInStorePickupPayLaterOrder = function (body) {
        return this.core.fetch('/marketplace/orders/inStorePickupPayLater', 'post', body);
    };
    /**
     * Gets the current Market Price for the specified SKU.
     *
     * @summary Get Market Price by SKU
     */
    SDK.prototype.pricing_GetMarketPriceByProductConditionId = function (metadata) {
        return this.core.fetch('/pricing/marketprices/{productconditionId}', 'get', metadata);
    };
    /**
     * Returns all product prices associated with the specified Group.
     *
     * @summary List Product Prices by Group
     */
    SDK.prototype.pricing_GetGroupPrices = function (metadata) {
        return this.core.fetch('/pricing/group/{groupId}', 'get', metadata);
    };
    /**
     * Returns all product market prices for the Ids specified.  Market prices that could
     * be found are returned in the results array in the response.  Market prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List Product Market Prices
     */
    SDK.prototype.pricing_GetProductPrices = function (metadata) {
        return this.core.fetch('/pricing/product/{productIds}', 'get', metadata);
    };
    /**
     * Returns all SKU market prices for the Ids specified.  Market prices that could
     * be found are returned in the results array in the response.  Market prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List SKU Market Prices
     */
    SDK.prototype.pricing_GetProductConditionPrices = function (metadata) {
        return this.core.fetch('/pricing/sku/{skuIds}', 'get', metadata);
    };
    /**
     * Returns all product buylist prices for the Ids specified.  Buylist prices that could
     * be found are returned in the results array in the response.  Buylist prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List Product Buylist Prices
     */
    SDK.prototype.pricing_GetProductBuylistPrices = function (metadata) {
        return this.core.fetch('/pricing/buy/product/{productIds}', 'get', metadata);
    };
    /**
     * Returns all SKU buylist prices for the Ids specified.  Buylist prices that could
     * be found are returned in the results array in the response.  Buylist prices that
     * could not be found are indicated in the errors array.
     *
     * @summary List SKU Buylist Prices
     */
    SDK.prototype.pricing_GetProductConditionBuylistPrices = function (metadata) {
        return this.core.fetch('/pricing/buy/sku/{skuIds}', 'get', metadata);
    };
    /**
     * Returns all product buylist prices associated with the specified Group.
     *
     * @summary List Product Buylist Prices by Group
     */
    SDK.prototype.pricing_GetGroupBuylistPrices = function (metadata) {
        return this.core.fetch('/pricing/buy/group/{groupId}', 'get', metadata);
    };
    /**
     * Get Store Settings
     *
     */
    SDK.prototype.stores_GetProIdentity = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/proservicessettings', 'get', metadata);
    };
    /**
     * Update Store Settings
     *
     */
    SDK.prototype.stores_PutProIdentity = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/proservicessettings', 'put', body, metadata);
    };
    /**
     * Get SKU Buylist Price.
     *
     * @summary Get SKU Buylist Price
     */
    SDK.prototype.stores_GetSkuBuylistPrice = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/skuprices/{skuBuylistPriceId}', 'get', metadata);
    };
    /**
     * List SKU Buylist Price
     *
     * @summary List SKU Buylist Price
     */
    SDK.prototype.stores_GetSkuBuylistPrices = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/skuprices', 'get', metadata);
    };
    /**
     * Perform multiple buylist updates asynchronously in a batch.  The response will
     * contain a single GUID to identify the batch.  All buylist updates are applied
     * to the buylist of the seller indicated by the bearer token used to make this
     * request. When the batch has been processed, a message will be sent to your
     * application's web hook containing the GUID from this response.
     *
     * @summary Batch Update Store Buylist Prices
     */
    SDK.prototype.stores_BatchUpdateStoreBuylistPrices = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/skus/batch', 'post', body, metadata);
    };
    /**
     * Create SKU Buylist
     *
     */
    SDK.prototype.stores_CreateStoreBuylistSku = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/skus/{skuId}', 'put', body, metadata);
    };
    /**
     * Update SKU Buylist Price
     *
     */
    SDK.prototype.stores_UpdateStoreBuylistSkuPrice = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/skus/{skuId}/price', 'put', body, metadata);
    };
    /**
     * Update SKU Buylist Quantity
     *
     */
    SDK.prototype.stores_UpdateStoreBuylistSkuQuantity = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/skus/{skuId}/quantity', 'put', body, metadata);
    };
    /**
     * Get Buylist Categories
     *
     */
    SDK.prototype.stores_GetSellerBuylistCategories = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/categories', 'get', metadata);
    };
    /**
     * Get Buylist Groups
     *
     */
    SDK.prototype.stores_GetSellerBuylistSets = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/groups', 'get', metadata);
    };
    /**
     * Get Store Buylist Settings
     *
     */
    SDK.prototype.stores_GetSellerBuylistSettings = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/settings', 'get', metadata);
    };
    /**
     * Get a Store's Buylist Products for Kiosk use.
     *
     */
    SDK.prototype.stores_GetBuylistProducts = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/products', 'get', metadata);
    };
    /**
     * Get the Product Conditions for a Product on a Store's Buylist.
     *
     */
    SDK.prototype.stores_GetBuylistProductConditions = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/buylist/{productId}', 'get', metadata);
    };
    /**
     * Returns a collection of storeKey values based on the search parameters.
     *
     * @summary Search Stores
     */
    SDK.prototype.stores_GetStores = function (metadata) {
        return this.core.fetch('/stores', 'get', metadata);
    };
    /**
     * Gets the current Store's Free Shipping option (if exists) whose Seller is associated
     * with the user's bearer token making this API call.
     *
     * @summary Get Free Shipping Option
     */
    SDK.prototype.stores_FreeShippingOptions = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/freeshipping/settings', 'get', metadata);
    };
    /**
     * Return address information about the Store specified by the storeKey.
     *
     * @summary Get Store Address
     */
    SDK.prototype.stores_GetStoreAddress = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/address', 'get', metadata);
    };
    /**
     * Return feedback information about the Store specified by the storeKey.
     *
     * @summary Get Store Feedback
     */
    SDK.prototype.stores_GetStoreFeedback = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/feedback', 'get', metadata);
    };
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
    SDK.prototype.stores_SetStoreStatus = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/status/{status}', 'put', metadata);
    };
    /**
     * Returns the total number of orders and total product dollar amount for all orders a
     * customer has place with the seller.
     * The token represents the unique seller and customer combination.
     *
     * @summary Get Customer Summary
     */
    SDK.prototype.stores_GetStoreCustomer = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/customers/{token}', 'get', metadata);
    };
    /**
     * Search Store Customers.
     *
     * @summary Search Store Customers
     */
    SDK.prototype.stores_GetStoreCustomers = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/customers', 'get', metadata);
    };
    /**
     * Returns the shipping addresses associated with the orders a customer has placed with the
     * seller.
     * The token represents the unique seller and customer combination.
     *
     * @summary Get Customer Addresses
     */
    SDK.prototype.stores_GetStoreCustomerAddresses = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/customers/{token}/addresses', 'get', metadata);
    };
    /**
     * Returns a list of orders containing the total product quantity and total product dollar
     * amount for each order a customer has placed with the seller.
     * The token represents the unique seller and customer combination.
     *
     * @summary Get Customer Orders
     */
    SDK.prototype.stores_GetStoreCustomerOrderSummary = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/customers/{token}/orders', 'get', metadata);
    };
    /**
     * Return general information about the current Store associated with the current bearer
     * token.
     *
     * @summary Get Store Info
     */
    SDK.prototype.stores_GetIdentity = function () {
        return this.core.fetch('/stores/self', 'get');
    };
    /**
     * Return general information about the stores specified by the store keys.
     *
     * @summary Get Store Info
     */
    SDK.prototype.stores_GetStoresByStoreKey = function (metadata) {
        return this.core.fetch('/stores/{storeKeys}', 'get', metadata);
    };
    /**
     * Get Product Inventory Quantities.
     *
     * @summary Get Product Inventory Quantities
     */
    SDK.prototype.stores_GetInventoryProductQuantity = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/products/{productId}/quantity', 'get', metadata);
    };
    /**
     * List Product Summary.
     *
     * @summary List Product Summary
     */
    SDK.prototype.stores_GetStoreInventory = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/products', 'get', metadata);
    };
    /**
     * List Product SKUs
     *
     */
    SDK.prototype.stores_GetStoreProductSkus = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/products/{productId}/skus', 'get', metadata);
    };
    /**
     * Related Products are other Products that are often purchased along with the specified
     * Product.
     *
     * @summary List Related Products
     */
    SDK.prototype.stores_GetRelatedProducts = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/products/{productId}/relatedproducts', 'get', metadata);
    };
    /**
     * List Shipping Options
     *
     */
    SDK.prototype.stores_ShippingOptions = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/products/{productId}/shippingoptions', 'get', metadata);
    };
    /**
     * Get SKU Quantity.
     *
     * @summary Get SKU Quantity
     */
    SDK.prototype.stores_GetInventorySkuQuantity = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skus/{skuId}/quantity', 'get', metadata);
    };
    /**
     * Increments the current store's inventory of this SKU from the current Store's inventory
     * whose Seller is associated with the user's bearer token making this API call.
     *
     * @summary Increment SKU Inventory Quantity
     */
    SDK.prototype.stores_UpdateStoreSkuQuantity = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skus/{skuId}/quantity', 'post', body, metadata);
    };
    /**
     * Adds or updates a SKU to the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary Update SKU inventory
     */
    SDK.prototype.stores_CreateStoreSku = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skus/{skuId}', 'put', body, metadata);
    };
    /**
     * Perform multiple price updates asynchronously in a batch.  The response will contain a
     * single GUID to identify the batch.  All price updates
     * are applied to the inventory of the seller indicated by the bearer token used to make
     * this request. When the batch has been processed, a message
     * will be sent to your application's web hook containing the GUID from this response.
     *
     * @summary Batch Update Store Sku Prices
     */
    SDK.prototype.stores_BatchUpdateStoreSkuPrices = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skus/batch', 'post', body, metadata);
    };
    /**
     * Updates the current store's pricing of this SKU from the current Store's inventory whose
     * Seller is associated with the user's bearer token making this API call.
     *
     * @summary Update SKU Inventory Price
     */
    SDK.prototype.stores_UpdateStoreSkuPrice = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skus/{skuId}/price', 'put', body, metadata);
    };
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary List SKU List Price
     */
    SDK.prototype.stores_GetInventorySkuPrices = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skuprices', 'get', metadata);
    };
    /**
     * Get SKU List Price.
     *
     * @summary Get SKU List Price
     */
    SDK.prototype.stores_GetInventorySkuPrice = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/skuprices/{skuListPriceId}', 'get', metadata);
    };
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary List All Groups
     */
    SDK.prototype.stores_GetStoreGroups = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/groups', 'get', metadata);
    };
    /**
     * List All Categories.
     *
     * @summary List All Categories.
     */
    SDK.prototype.stores_GetStoreCategories = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/categories', 'get', metadata);
    };
    /**
     * List all products based on criteria
     *
     * @summary List Product Summary By Category
     */
    SDK.prototype.stores_ProductSearchByCategory = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/categories/{categoryId}/search', 'post', body, metadata);
    };
    /**
     * List All Channels for a Store.
     *
     * @summary List Store Channels
     */
    SDK.prototype.stores_GetStoreChannels = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/channels', 'get', metadata);
    };
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     *
     * @summary List Top Sold Products
     */
    SDK.prototype.stores_GetTopSalesForSeller = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/topsales', 'get', metadata);
    };
    /**
     * This listing comes from the current Store's inventory whose Seller is associated with
     * the user's bearer token making this API call.
     * Similar to the other Top Sales Search except that you can specify search criteria in the
     * sellerTssc parameter.
     *
     * @summary Search Top Sold Products
     */
    SDK.prototype.stores_TopSalesSearch = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/topsalessearch', 'post', body, metadata);
    };
    /**
     * SearchResults returned can include Product, Groups, and Categories.
     *
     * @summary List Catalog Objects
     */
    SDK.prototype.stores_SearchInventory = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/search', 'get', metadata);
    };
    /**
     * Retrieves the custom listing by the criteria passed in the querystring.
     *
     * @summary Search Custom Listings.
     */
    SDK.prototype.stores_GetCustomListing = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/inventory/customListings', 'get', metadata);
    };
    /**
     * Get Order Manifest.
     *
     * @summary Get Order Manifest
     */
    SDK.prototype.stores_GetStoreOrderManifest = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/orders/manifest', 'get', metadata);
    };
    /**
     * Get Order Details.
     *
     * @summary Get Order Details
     */
    SDK.prototype.stores_GetStoreOrdersByOrderNumber = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/orders/{orderNumbers}', 'get', metadata);
    };
    /**
     * Get Order Feedback.
     *
     * @summary Get Order Feedback
     */
    SDK.prototype.stores_GetStoreOrderFeedback = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/orders/{orderNumber}/feedback', 'get', metadata);
    };
    /**
     * Search Orders.
     *
     * @summary Search Orders
     */
    SDK.prototype.stores_GetStoreOrders = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/orders', 'get', metadata);
    };
    /**
     * Get Order Items.
     *
     * @summary Get Order Items
     */
    SDK.prototype.stores_GetStoreOrderLineItems = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/orders/{orderNumber}/items', 'get', metadata);
    };
    /**
     * Get Order Tracking Numbers.
     *
     * @summary Get Order Tracking Numbers
     */
    SDK.prototype.stores_GetStoreOrderTracking = function (metadata) {
        return this.core.fetch('/stores/{storeKey}/orders/{orderNumber}/tracking', 'get', metadata);
    };
    /**
     * Add Order Tracking Number.
     *
     * @summary Add Order Tracking Number
     */
    SDK.prototype.stores_CreateStoreOrderTracking = function (body, metadata) {
        return this.core.fetch('/stores/{storeKey}/orders/{orderNumber}/tracking', 'post', body, metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
