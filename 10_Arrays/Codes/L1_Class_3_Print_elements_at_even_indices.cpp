#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {5, 8, 13, 21, 34, 55, 89};
    int n = arr.size();

    cout << "Elements at even indices:" << endl;
    for (int i = 0; i < n; i += 2) {    // 0, 2, 4, 6
        cout << "  index " << i << " -> " << arr[i] << endl;
    }

    cout << "Elements at odd indices: ";
    for (int i = 1; i < n; i += 2) {    // 1, 3, 5
        cout << arr[i] << " ";
    }
    cout << endl;
    return 0;
}
