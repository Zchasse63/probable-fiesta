"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/lib/hooks/use-products";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Initialize form data from product (uses key prop for reset on product change)
  const [formData, setFormData] = useState({
    item_code: product?.item_code || "",
    description: product?.description || "",
    pack_size: product?.pack_size || "",
    case_weight_lbs: product?.case_weight_lbs || 0,
    brand: product?.brand || "",
    category: product?.category || "",
    warehouse_id: product?.warehouse_id || 1,
    cases_available: product?.cases_available || 0,
    unit_cost: product?.unit_cost || 0,
    spec_sheet_url: product?.spec_sheet_url || "",
  });

  const handleSave = async () => {
    try {
      // Calculate cost per lb
      const costPerLb = formData.case_weight_lbs && formData.unit_cost
        ? formData.unit_cost / formData.case_weight_lbs
        : null;

      await updateProduct.mutateAsync({
        id,
        ...formData,
        cost_per_lb: costPerLb,
      });

      toast.success("Product updated successfully");
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) {
      return;
    }

    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted successfully");
      router.push("/inventory");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <button
          onClick={() => router.push("/inventory")}
          className="mt-4 text-primary hover:underline"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl" key={product?.id}>
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/inventory")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </button>

      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{product.item_code}</h1>
            <p className="text-muted-foreground mt-1">{product.description}</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {deleteProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Item Code
              </label>
              <input
                type="text"
                value={formData.item_code}
                onChange={(e) =>
                  setFormData({ ...formData, item_code: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Pack Size
              </label>
              <input
                type="text"
                value={formData.pack_size}
                onChange={(e) =>
                  setFormData({ ...formData, pack_size: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Case Weight (lbs)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.case_weight_lbs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    case_weight_lbs: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select category</option>
                <option value="chicken">Chicken</option>
                <option value="beef">Beef</option>
                <option value="pork">Pork</option>
                <option value="seafood">Seafood</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Warehouse
              </label>
              <select
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    warehouse_id: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="1">PA Boyertown</option>
                <option value="2">GA Americus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Cases Available
              </label>
              <input
                type="number"
                value={formData.cases_available}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cases_available: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit_cost: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Cost Per LB ($)
              </label>
              <input
                type="text"
                value={
                  formData.case_weight_lbs && formData.unit_cost
                    ? (formData.unit_cost / formData.case_weight_lbs).toFixed(4)
                    : "—"
                }
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Spec Sheet URL
            </label>
            <input
              type="url"
              value={formData.spec_sheet_url}
              onChange={(e) =>
                setFormData({ ...formData, spec_sheet_url: e.target.value })
              }
              placeholder="https://example.com/spec.pdf"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => router.push("/inventory")}
              className="px-6 py-2 border rounded-lg hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateProduct.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {updateProduct.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
