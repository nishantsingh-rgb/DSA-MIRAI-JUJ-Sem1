#include <iostream>
#include <vector>
using namespace std;

int search(const vector<int> &nums, int target) {
    int low = 0, high = nums.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        cout << "  low = " << low << ", high = " << high << ", mid = " << mid
             << " (" << nums[mid] << ")" << endl;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid + 1;              // target is in the right half
        } else {
            high = mid - 1;             // target is in the left half
        }
    }
    return -1;
}

int main() {
    vector<int> nums = {-1, 0, 3, 5, 9, 12};

    cout << "Search 9:" << endl;
    int idx = search(nums, 9);
    cout << "Index = " << idx << endl;

    cout << "Search 2:" << endl;
    idx = search(nums, 2);
    cout << "Index = " << idx << " (not found)" << endl;
    return 0;
}
