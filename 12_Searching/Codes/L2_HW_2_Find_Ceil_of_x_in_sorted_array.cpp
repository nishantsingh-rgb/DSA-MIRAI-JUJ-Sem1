#include <iostream>
#include <vector>
using namespace std;

// index of the smallest element >= x, or -1 if there is none
int ceilIndex(const vector<int> &arr, int x) {
    int low = 0, high = arr.size() - 1;
    int ans = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] >= x) {
            ans = mid;                  // a candidate; look for a smaller one
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return ans;
}

int main() {
    vector<int> arr = {1, 2, 8, 10, 10, 12, 19};
    int queries[] = {5, 10, 0, 20};

    for (int x : queries) {
        int idx = ceilIndex(arr, x);
        if (idx == -1) {
            cout << "ceil(" << x << ") does not exist" << endl;
        } else {
            cout << "ceil(" << x << ") = " << arr[idx] << " at index " << idx << endl;
        }
    }
    return 0;
}
