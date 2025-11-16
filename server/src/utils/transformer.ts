import {EbayBrowseItem, EbayItem} from '../types';


export function mapBrowseItemToEbayItem(raw: EbayBrowseItem): EbayItem {
    const price = raw.price ? Number(raw.price.value) : 0;
    const currency = raw.price?.currency ?? "USD";

    // 主类目：优先用 categories[0].categoryName
    const category =
        raw.categories?.[0]?.categoryName ??
        "Unknown";

    // 主图
    const imageUrl =
        raw.image?.imageUrl ??
        raw.thumbnailImages?.[0]?.imageUrl ??
        undefined;

    // 运费 & 预估天数
    const shipping = raw.shippingOptions?.[0];
    let freeShipping = false;
    let estimatedDays: number | undefined;

    if (shipping) {
        const cost = shipping.shippingCost
            ? Number(shipping.shippingCost.value)
            : 0;
        freeShipping = cost === 0;

        if (shipping.minEstimatedDeliveryDate) {
            const minDate = new Date(shipping.minEstimatedDeliveryDate);
            const now = new Date();
            const diffMs = minDate.getTime() - now.getTime();
            estimatedDays = Math.max(
                0,
                Math.round(diffMs / (1000 * 60 * 60 * 24))
            );
        }
    }

    return {
        itemId: raw.itemId,
        title: raw.title,
        price,
        currency,
        // 这里 brand 先用 seller.username，之后你可以自己再细化解析
        brand: raw.seller?.username,
        category,
        isActive: true, // Browse 返回的基本都是在售
        imageUrl,
        shippingInfo: {
            freeShipping,
            estimatedDays,
        },
    };
}
