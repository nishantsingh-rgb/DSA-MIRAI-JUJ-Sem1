#include <iostream>
#include <vector>
using namespace std;

int firstOccurrence(const vector<int> &arr, int x) {
    int low = 0, high = arr.size() - 1;
    int ans = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == x) {
            ans = mid;                  // a match - but maybe not the first
            high = mid - 1;             // keep looking on the left
        } else if (arr[mid] < x) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
}

int main() {
    vector<int> arr = {1, 2, 2, 2, 3, 4, 4, 5};

    cout << "First 2 at index " << firstOccurrence(arr, 2) << endl;
    cout << "First 4 at index " << firstOccurrence(arr, 4) << endl;
    cout << "First 6 at index " << firstOccurrence(arr, 6) << endl;
    return 0;
}
