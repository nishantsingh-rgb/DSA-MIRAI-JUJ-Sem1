#include <iostream>
#include <algorithm>
#include <vector>
using namespace std;

// goLeft = true finds the first position, false finds the last
int findBound(const vector<int> &nums, int target, bool goLeft) {
    int low = 0, high = nums.size() - 1;
    int ans = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) {
            ans = mid;
            if (goLeft) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
}

int main() {
    vector<int> nums = {5, 7, 7, 8, 8, 10};
    int targets[] = {8, 7, 6};

    for (int t : targets) {
        int first = findBound(nums, t, true);
        int last = findBound(nums, t, false);
        cout << "target " << t << " -> [" << first << ", " << last << "]" << endl;
    }

    // the same with the STL
    int lo = lower_bound(nums.begin(), nums.end(), 8) - nums.begin();
    int hi = upper_bound(nums.begin(), nums.end(), 8) - nums.begin();
    cout << "STL for 8: first = " << lo << ", last = " << hi - 1
         << ", count = " << hi - lo << endl;
    return 0;
}
