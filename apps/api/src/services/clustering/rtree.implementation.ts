// R-tree implementation for spatial indexing
export interface Rectangle {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RTreeNode<T> extends Rectangle {
  data?: T;
  children?: RTreeNode<T>[];
  leaf: boolean;
}

export interface RTreeItem<T> extends Rectangle {
  data: T;
}

export class RTree<T> {
  private root!: RTreeNode<T>;
  private readonly maxEntries: number;
  private readonly minEntries: number;

  constructor(maxEntries = 9) {
    this.maxEntries = Math.max(4, maxEntries);
    this.minEntries = Math.max(2, Math.ceil(this.maxEntries * 0.4));
    this.clear();
  }

  clear(): void {
    this.root = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      children: [],
      leaf: true,
    };
  }

  insert(item: RTreeItem<T>): this {
    this.insertItem(item, this.root, 0);
    return this;
  }

  search(bbox: Rectangle): RTreeItem<T>[] {
    const results: RTreeItem<T>[] = [];
    this.searchNode(bbox, this.root, results);
    return results;
  }

  // Search for items within a radius of a point
  searchWithinRadius(
    centerX: number,
    centerY: number,
    radius: number,
  ): RTreeItem<T>[] {
    const bbox = {
      minX: centerX - radius,
      minY: centerY - radius,
      maxX: centerX + radius,
      maxY: centerY + radius,
    };

    const candidates = this.search(bbox);

    // Filter by actual distance
    return candidates.filter((item) => {
      const itemCenterX = (item.minX + item.maxX) / 2;
      const itemCenterY = (item.minY + item.maxY) / 2;
      const distance = Math.sqrt(
        Math.pow(itemCenterX - centerX, 2) + Math.pow(itemCenterY - centerY, 2),
      );
      return distance <= radius;
    });
  }

  private insertItem(
    item: RTreeItem<T>,
    node: RTreeNode<T>,
    level: number,
  ): void {
    if (node.leaf) {
      node.children!.push(item as any);
      this.extend(node, item);
    } else {
      const bestChild = this.chooseSubtree(item, node);
      this.insertItem(item, bestChild, level + 1);
      this.extend(node, bestChild);
    }

    if (node.children!.length > this.maxEntries) {
      this.split(node, level);
    }
  }

  private searchNode(
    bbox: Rectangle,
    node: RTreeNode<T>,
    results: RTreeItem<T>[],
  ): void {
    if (!this.intersects(bbox, node)) return;

    if (node.leaf) {
      for (const child of node.children!) {
        if (this.intersects(bbox, child)) {
          results.push(child as RTreeItem<T>);
        }
      }
    } else {
      for (const child of node.children!) {
        this.searchNode(bbox, child, results);
      }
    }
  }

  private chooseSubtree(item: Rectangle, node: RTreeNode<T>): RTreeNode<T> {
    let bestChild = node.children![0];
    let bestArea =
      this.area(this.extend({ ...bestChild }, item)) - this.area(bestChild);

    for (let i = 1; i < node.children!.length; i++) {
      const child = node.children![i];
      const area =
        this.area(this.extend({ ...child }, item)) - this.area(child);
      if (area < bestArea) {
        bestArea = area;
        bestChild = child;
      }
    }

    return bestChild;
  }

  private split(node: RTreeNode<T>, _level: number): void {
    const children = node.children!;
    const newNode: RTreeNode<T> = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      children: [],
      leaf: node.leaf,
    };

    // Simple split along the longest axis
    const isVertical = node.maxX - node.minX > node.maxY - node.minY;
    children.sort((a, b) => (isVertical ? a.minX - b.minX : a.minY - b.minY));

    const splitIndex = Math.ceil(children.length / 2);
    newNode.children = children.splice(splitIndex);

    // Recalculate bounding boxes
    this.calcBBox(node);
    this.calcBBox(newNode);

    if (node === this.root) {
      this.splitRoot(node, newNode);
    }
  }

  private splitRoot(left: RTreeNode<T>, right: RTreeNode<T>): void {
    this.root = {
      minX: Math.min(left.minX, right.minX),
      minY: Math.min(left.minY, right.minY),
      maxX: Math.max(left.maxX, right.maxX),
      maxY: Math.max(left.maxY, right.maxY),
      children: [left, right],
      leaf: false,
    };
  }

  private extend(a: Rectangle, b: Rectangle): Rectangle {
    return {
      minX: Math.min(a.minX, b.minX),
      minY: Math.min(a.minY, b.minY),
      maxX: Math.max(a.maxX, b.maxX),
      maxY: Math.max(a.maxY, b.maxY),
    };
  }

  private area(bbox: Rectangle): number {
    return (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY);
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return !(
      a.minX > b.maxX ||
      b.minX > a.maxX ||
      a.minY > b.maxY ||
      b.minY > a.maxY
    );
  }

  private calcBBox(node: RTreeNode<T>): void {
    node.minX = Infinity;
    node.minY = Infinity;
    node.maxX = -Infinity;
    node.maxY = -Infinity;

    for (const child of node.children!) {
      this.extend(node, child);
    }
  }
}
