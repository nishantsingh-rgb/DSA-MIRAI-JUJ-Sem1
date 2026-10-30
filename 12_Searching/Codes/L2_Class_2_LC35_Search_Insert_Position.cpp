#include <iostream>
#include <algorithm>
#include <vector>
using namespace std;

int searchInsert(const vector<int> &nums, int target) {
    int low = 0, high = nums.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return low;                         // where target would be inserted
}

int main() {
    vector<int> nums = {1, 3, 5, 6};
    int targets[] = {5, 2, 7, 0};

    for (int t : targets) {
        int pos = searchInsert(nums, t);
        int lb = lower_bound(nums.begin(), nums.end(), t) - nums.begin();
        cout << "target " << t << " -> " << pos << "  (lower_bound gives " << lb << ")" << endl;
    }
    return 0;
}
